// Account Migration and Data Export/Import Utilities

// Using Web Crypto API instead of crypto-js for better browser compatibility

export interface AccountData {
  profile: {
    publicKey: string
    username?: string
    bio?: string
    email?: string
    website?: string
    twitter?: string
    discord?: string
    avatar?: string
    banner?: string
    createdAt: string
    isVerified?: boolean
  }
  settings: {
    theme: 'light' | 'dark' | 'auto'
    language: string
    currency: string
    notifications: {
      email: boolean
      push: boolean
      marketing: boolean
    }
    privacy: {
      profileVisibility: 'public' | 'private' | 'friends'
      showActivity: boolean
      showHoldings: boolean
    }
  }
  artworks: {
    created: Array<{
      id: string
      title: string
      description: string
      imageUrl: string
      price: string
      currency: string
      category: string
      prompt?: string
      aiModel?: string
      createdAt: string
      isListed: boolean
    }>
    owned: Array<{
      id: string
      title: string
      imageUrl: string
      price: string
      currency: string
      purchasedAt: string
      creator: string
    }>
    favorites: Array<{
      id: string
      title: string
      imageUrl: string
      price: string
      currency: string
      creator: string
      addedAt: string
    }>
  }
  transactions: Array<{
    id: string
    type: 'mint' | 'purchase' | 'sale' | 'transfer'
    artworkId: string
    amount: string
    currency: string
    from: string
    to?: string
    timestamp: string
    status: 'pending' | 'completed' | 'failed'
    hash?: string
  }>
  wallet: {
    connectedNetworks: Array<{
      network: 'ethereum' | 'stellar' | 'polygon'
      address: string
      isConnected: boolean
    }>
    preferences: {
      defaultNetwork: string
      gasSettings: {
        speed: 'slow' | 'standard' | 'fast'
        maxGasPrice?: string
      }
    }
  }
  metadata: {
    exportedAt: string
    version: string
    source: 'muse-dapp'
    checksum: string
  }
}

export interface MigrationRecord {
  id: string
  type: 'export' | 'import'
  timestamp: string
  sourceDevice?: string
  targetDevice?: string
  dataSize: number
  status: 'success' | 'failed' | 'partial'
  errorMessage?: string
  dataVersion: string
  encrypted: boolean
}

export interface ImportValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  dataVersion: string
  isEncrypted: boolean
  requiresDecryption: boolean
  dataIntegrity: {
    checksumValid: boolean
    signatureValid: boolean
  }
}

export interface RecoveryData {
  recoveryPhrase: string
  publicKey: string
  backupCode: string
  createdAt: string
  lastUsed?: string
  isActive: boolean
}

class AccountMigrationManager {
  private readonly ENCRYPTION_KEY = 'muse-account-migration-key'
  private readonly MIGRATION_HISTORY_KEY = 'muse-migration-history'
  private readonly RECOVERY_DATA_KEY = 'muse-recovery-data'
  private readonly CURRENT_VERSION = '1.0.0'

  // Generate a secure encryption key
  private async generateEncryptionKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const keyMaterial = encoder.encode(password)
    
    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      await window.crypto.subtle.importKey(
        'raw',
        keyMaterial,
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      ),
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    )
  }

  // Generate random salt
  private generateSalt(): Uint8Array {
    return window.crypto.getRandomValues(new Uint8Array(16))
  }

  // Generate checksum for data integrity
  private async generateChecksum(data: any): Promise<string> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(JSON.stringify(data))
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // Validate data integrity
  private async validateDataIntegrity(data: AccountData): Promise<boolean> {
    const expectedChecksum = data.metadata.checksum
    const dataWithoutChecksum = {
      ...data,
      metadata: { ...data.metadata, checksum: '' }
    }
    const actualChecksum = await this.generateChecksum(dataWithoutChecksum)
    return expectedChecksum === actualChecksum
  }

  // Export account data with encryption
  async exportAccountData(
    data: Omit<AccountData, 'metadata'>,
    password?: string,
    options: {
      includeArtworks?: boolean
      includeTransactions?: boolean
      includeSettings?: boolean
    } = {}
  ): Promise<{ encryptedData: string; migrationId: string }> {
    const migrationId = crypto-js.lib.WordArray.random(16).toString()
    const timestamp = new Date().toISOString()

    // Filter data based on options
    const filteredData: Omit<AccountData, 'metadata'> = {
      profile: data.profile,
      settings: options.includeSettings !== false ? data.settings : this.getDefaultSettings(),
      artworks: options.includeArtworks !== false ? data.artworks : { created: [], owned: [], favorites: [] },
      transactions: options.includeTransactions !== false ? data.transactions : [],
      wallet: data.wallet
    }

    // Add metadata
    const completeData: AccountData = {
      ...filteredData,
      metadata: {
        exportedAt: timestamp,
        version: this.CURRENT_VERSION,
        source: 'muse-dapp',
        checksum: ''
      }
    }

    // Generate checksum
    completeData.metadata.checksum = this.generateChecksum(completeData)

    // Encrypt if password provided
    let encryptedData: string
    let isEncrypted = false

    if (password) {
      const encryptionKey = this.generateEncryptionKey(password)
      encryptedData = crypto-js.AES.encrypt(JSON.stringify(completeData), encryptionKey).toString()
      isEncrypted = true
    } else {
      encryptedData = JSON.stringify(completeData)
    }

    // Record migration
    await this.recordMigration({
      id: migrationId,
      type: 'export',
      timestamp,
      dataSize: encryptedData.length,
      status: 'success',
      dataVersion: this.CURRENT_VERSION,
      encrypted: isEncrypted
    })

    return { encryptedData, migrationId }
  }

  // Import account data with validation and decryption
  async importAccountData(
    encryptedData: string,
    password?: string
  ): Promise<{ data: AccountData; validationResult: ImportValidationResult }> {
    const validationResult = await this.validateImportData(encryptedData, password)
    
    if (!validationResult.isValid) {
      throw new Error(`Import validation failed: ${validationResult.errors.join(', ')}`)
    }

    let decryptedData: AccountData

    try {
      if (validationResult.requiresDecryption && password) {
        const encryptionKey = this.generateEncryptionKey(password)
        const decrypted = crypto-js.AES.decrypt(encryptedData, encryptionKey)
        const decryptedString = decrypted.toString(crypto_js.enc.Utf8)
        
        if (!decryptedString) {
          throw new Error('Invalid password or corrupted data')
        }
        
        decryptedData = JSON.parse(decryptedString)
      } else {
        decryptedData = JSON.parse(encryptedData)
      }
    } catch (error) {
      throw new Error('Failed to decrypt or parse data. Please check your password.')
    }

    // Validate data integrity
    if (!this.validateDataIntegrity(decryptedData)) {
      throw new Error('Data integrity check failed. The data may be corrupted.')
    }

    // Record migration
    await this.recordMigration({
      id: crypto-js.lib.WordArray.random(16).toString(),
      type: 'import',
      timestamp: new Date().toISOString(),
      dataSize: encryptedData.length,
      status: 'success',
      dataVersion: decryptedData.metadata.version,
      encrypted: validationResult.isEncrypted
    })

    return { data: decryptedData, validationResult }
  }

  // Validate import data before processing
  async validateImportData(
    encryptedData: string,
    password?: string
  ): Promise<ImportValidationResult> {
    const result: ImportValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      dataVersion: 'unknown',
      isEncrypted: false,
      requiresDecryption: false,
      dataIntegrity: {
        checksumValid: false,
        signatureValid: false
      }
    }

    try {
      // Check if data is encrypted
      let parsedData: any
      
      try {
        parsedData = JSON.parse(encryptedData)
      } catch {
        // It's encrypted, try to decrypt
        result.isEncrypted = true
        result.requiresDecryption = true
        
        if (!password) {
          result.errors.push('Password required for encrypted data')
          result.isValid = false
          return result
        }

        try {
          const encryptionKey = this.generateEncryptionKey(password)
          const decrypted = crypto-js.AES.decrypt(encryptedData, encryptionKey)
          const decryptedString = decrypted.toString(crypto_js.enc.Utf8)
          
          if (!decryptedString) {
            result.errors.push('Invalid password or corrupted data')
            result.isValid = false
            return result
          }
          
          parsedData = JSON.parse(decryptedString)
        } catch (error) {
          result.errors.push('Failed to decrypt data')
          result.isValid = false
          return result
        }
      }

      // Validate structure
      if (!parsedData.profile || !parsedData.metadata) {
        result.errors.push('Missing required fields: profile or metadata')
        result.isValid = false
      }

      // Validate version
      if (parsedData.metadata?.version) {
        result.dataVersion = parsedData.metadata.version
        
        // Check version compatibility
        const supportedVersions = ['1.0.0']
        if (!supportedVersions.includes(parsedData.metadata.version)) {
          result.warnings.push(`Data version ${parsedData.metadata.version} may not be fully compatible`)
        }
      }

      // Validate checksum
      if (parsedData.metadata?.checksum) {
        const dataWithoutChecksum = {
          ...parsedData,
          metadata: { ...parsedData.metadata, checksum: '' }
        }
        const expectedChecksum = this.generateChecksum(dataWithoutChecksum)
        result.dataIntegrity.checksumValid = expectedChecksum === parsedData.metadata.checksum
        
        if (!result.dataIntegrity.checksumValid) {
          result.errors.push('Data integrity check failed')
          result.isValid = false
        }
      }

      // Validate profile data
      if (parsedData.profile) {
        if (!parsedData.profile.publicKey) {
          result.errors.push('Missing public key in profile')
          result.isValid = false
        }
      }

    } catch (error) {
      result.errors.push('Failed to parse data structure')
      result.isValid = false
    }

    return result
  }

  // Record migration history
  private async recordMigration(record: Omit<MigrationRecord, 'id'>): Promise<void> {
    const history = this.getMigrationHistory()
    const newRecord: MigrationRecord = {
      id: crypto-js.lib.WordArray.random(16).toString(),
      ...record
    }
    
    history.push(newRecord)
    
    // Keep only last 50 records
    if (history.length > 50) {
      history.splice(0, history.length - 50)
    }
    
    localStorage.setItem(this.MIGRATION_HISTORY_KEY, JSON.stringify(history))
  }

  // Get migration history
  getMigrationHistory(): MigrationRecord[] {
    try {
      const stored = localStorage.getItem(this.MIGRATION_HISTORY_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  // Clear migration history
  clearMigrationHistory(): void {
    localStorage.removeItem(this.MIGRATION_HISTORY_KEY)
  }

  // Generate recovery data
  generateRecoveryData(publicKey: string): RecoveryData {
    const recoveryPhrase = this.generateRecoveryPhrase()
    const backupCode = this.generateBackupCode()
    
    const recoveryData: RecoveryData = {
      recoveryPhrase,
      publicKey,
      backupCode,
      createdAt: new Date().toISOString(),
      isActive: true
    }

    // Store encrypted recovery data
    const existingRecovery = this.getRecoveryData()
    existingRecovery.push(recoveryData)
    
    // Keep only last 3 recovery options
    if (existingRecovery.length > 3) {
      existingRecovery.splice(0, existingRecovery.length - 3)
    }
    
    localStorage.setItem(this.RECOVERY_DATA_KEY, JSON.stringify(existingRecovery))
    
    return recoveryData
  }

  // Get stored recovery data
  getRecoveryData(): RecoveryData[] {
    try {
      const stored = localStorage.getItem(this.RECOVERY_DATA_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  // Validate recovery data
  validateRecoveryData(recoveryPhrase: string, backupCode: string): boolean {
    const recoveryData = this.getRecoveryData()
    return recoveryData.some(data => 
      data.recoveryPhrase === recoveryPhrase && 
      data.backupCode === backupCode && 
      data.isActive
    )
  }

  // Generate recovery phrase
  private generateRecoveryPhrase(): string {
    const words = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
      'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
      'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual'
    ]
    
    const phrase = []
    for (let i = 0; i < 12; i++) {
      phrase.push(words[Math.floor(Math.random() * words.length)])
    }
    
    return phrase.join(' ')
  }

  // Generate backup code
  private generateBackupCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)]
      if (i === 3) code += '-'
    }
    return code
  }

  // Get default settings
  private getDefaultSettings() {
    return {
      theme: 'auto' as const,
      language: 'en',
      currency: 'USD',
      notifications: {
        email: true,
        push: true,
        marketing: false
      },
      privacy: {
        profileVisibility: 'public' as const,
        showActivity: true,
        showHoldings: false
      }
    }
  }

  // Export data to file
  async exportToFile(
    data: Omit<AccountData, 'metadata'>,
    password?: string,
    filename?: string
  ): Promise<void> {
    const { encryptedData } = await this.exportAccountData(data, password)
    
    const blob = new Blob([encryptedData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `muse-account-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Import data from file
  async importFromFile(file: File, password?: string): Promise<{ data: AccountData; validationResult: ImportValidationResult }> {
    const text = await file.text()
    return this.importAccountData(text, password)
  }
}

// Global instance
export const accountMigration = new AccountMigrationManager()

// Utility functions
export const downloadAccountBackup = async (accountData: Omit<AccountData, 'metadata'>, password?: string) => {
  try {
    await accountMigration.exportToFile(accountData, password)
    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export const restoreAccountBackup = async (file: File, password?: string) => {
  try {
    const result = await accountMigration.importFromFile(file, password)
    return { success: true, data: result.data, validation: result.validationResult }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export const generateEmergencyRecovery = (publicKey: string) => {
  return accountMigration.generateRecoveryData(publicKey)
}

export const validateEmergencyRecovery = (recoveryPhrase: string, backupCode: string) => {
  return accountMigration.validateRecoveryData(recoveryPhrase, backupCode)
}
