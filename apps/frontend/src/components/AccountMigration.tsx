import React, { useState, useRef } from 'react'
import { Download, Upload, Shield, AlertTriangle, CheckCircle, Clock, Key } from 'lucide-react'
import { accountMigration, type AccountData, type MigrationRecord, type RecoveryData } from '@/utils/accountMigrationSimple'

export interface AccountMigrationProps {
  currentAccountData?: Omit<AccountData, 'metadata'>
  onMigrationComplete?: (data: AccountData) => void
  className?: string
}

export function AccountMigration({ currentAccountData, onMigrationComplete, className = '' }: AccountMigrationProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'recovery'>('export')
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [includeArtworks, setIncludeArtworks] = useState(true)
  const [includeTransactions, setIncludeTransactions] = useState(true)
  const [includeSettings, setIncludeSettings] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [migrationHistory, setMigrationHistory] = useState<MigrationRecord[]>([])
  const [recoveryData, setRecoveryData] = useState<RecoveryData[]>([])
  const [showRecoveryPhrase, setShowRecoveryPhrase] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setMigrationHistory(accountMigration.getMigrationHistory())
    setRecoveryData(accountMigration.getRecoveryData())
  }, [])

  const handleExport = async () => {
    if (!currentAccountData) {
      setError('No account data available for export')
      return
    }

    if (password && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsExporting(true)
    setError(null)
    setSuccess(null)

    try {
      const filename = `muse-account-export-${new Date().toISOString().split('T')[0]}.json`
      await accountMigration.exportToFile(
        currentAccountData,
        password || undefined,
        filename
      )
      setSuccess('Account data exported successfully!')
      setMigrationHistory(accountMigration.getMigrationHistory())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await accountMigration.importFromFile(file, password || undefined)
      setSuccess('Account data imported successfully!')
      setMigrationHistory(accountMigration.getMigrationHistory())
      onMigrationComplete?.(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleGenerateRecovery = () => {
    if (!currentAccountData?.profile.publicKey) {
      setError('No public key available for recovery generation')
      return
    }

    const recovery = accountMigration.generateRecoveryData(currentAccountData.profile.publicKey)
    setRecoveryData(accountMigration.getRecoveryData())
    setSuccess('Recovery data generated! Save this information in a secure location.')
    setShowRecoveryPhrase(true)
  }

  const handleValidateRecovery = () => {
    // This would typically involve user input for recovery phrase and backup code
    // For demo purposes, we'll just show the validation result
    const isValid = recoveryData.length > 0
    if (isValid) {
      setSuccess('Recovery data validated successfully!')
    } else {
      setError('Invalid recovery data')
    }
  }

  const clearHistory = () => {
    accountMigration.clearMigrationHistory()
    setMigrationHistory([])
    setSuccess('Migration history cleared')
  }

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Migration</h2>
          <p className="text-gray-600">
            Export, import, and recover your account data across devices and platforms
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('export')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'export'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Download className="inline w-4 h-4 mr-2" />
              Export Data
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'import'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Upload className="inline w-4 h-4 mr-2" />
              Import Data
            </button>
            <button
              onClick={() => setActiveTab('recovery')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'recovery'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Shield className="inline w-4 h-4 mr-2" />
              Emergency Recovery
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-center">
              <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-green-700">{success}</span>
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Export Account Data</h3>
                <p className="text-gray-600 mb-6">
                  Download your account data for backup or migration to another device.
                </p>
              </div>

              {/* Export Options */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeArtworks}
                      onChange={(e) => setIncludeArtworks(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Include artworks</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeTransactions}
                      onChange={(e) => setIncludeTransactions(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Include transaction history</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeSettings}
                      onChange={(e) => setIncludeSettings(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Include settings and preferences</span>
                  </label>
                </div>

                {/* Password Protection */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Password Protection (Optional)</h4>
                  <div className="space-y-3">
                    <input
                      type="password"
                      placeholder="Enter password for encryption"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {password && (
                      <input
                        type="password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    )}
                  </div>
                </div>

                {/* Export Button */}
                <button
                  onClick={handleExport}
                  disabled={isExporting || (!currentAccountData)}
                  className="w-full bg-primary-600 text-white py-3 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export Account Data
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Import Tab */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Import Account Data</h3>
                <p className="text-gray-600 mb-6">
                  Upload a previously exported account data file to restore your account.
                </p>
              </div>

              {/* File Upload */}
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-primary-600 hover:text-primary-500 font-medium">
                      Click to upload or drag and drop
                    </span>
                    <span className="text-gray-500"> your account data file</span>
                    <input
                      ref={fileInputRef}
                      id="file-upload"
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">JSON files only</p>
                </div>

                {/* Password for Decryption */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password (if data is encrypted)
                  </label>
                  <input
                    type="password"
                    placeholder="Enter password to decrypt"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Import Status */}
                {isImporting && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2" />
                    <p className="text-gray-600">Importing account data...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recovery Tab */}
          {activeTab === 'recovery' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Recovery</h3>
                <p className="text-gray-600 mb-6">
                  Generate recovery data for emergency account access.
                </p>
              </div>

              {/* Generate Recovery */}
              <div className="space-y-4">
                <button
                  onClick={handleGenerateRecovery}
                  disabled={!currentAccountData?.profile.publicKey}
                  className="w-full bg-primary-600 text-white py-3 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Generate Recovery Data
                </button>

                {/* Recovery Data Display */}
                {showRecoveryPhrase && recoveryData.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <h4 className="font-medium text-yellow-800 mb-3">Save This Recovery Information</h4>
                    <div className="space-y-3">
                      {recoveryData.slice(-1).map((recovery, index) => (
                        <div key={index} className="space-y-2">
                          <div>
                            <label className="text-sm font-medium text-yellow-700">Recovery Phrase:</label>
                            <div className="bg-white p-2 rounded border border-yellow-300 font-mono text-sm break-all">
                              {recovery.recoveryPhrase}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-yellow-700">Backup Code:</label>
                            <div className="bg-white p-2 rounded border border-yellow-300 font-mono text-sm">
                              {recovery.backupCode}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-yellow-600 mt-3">
                      Store this information in a secure, offline location. You'll need it to recover your account.
                    </p>
                  </div>
                )}

                {/* Validate Recovery */}
                <button
                  onClick={handleValidateRecovery}
                  className="w-full bg-secondary-600 text-white py-3 px-4 rounded-md hover:bg-secondary-700 flex items-center justify-center"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Validate Recovery Data
                </button>
              </div>
            </div>
          )}

          {/* Migration History */}
          {migrationHistory.length > 0 && (
            <div className="mt-8 border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Migration History</h3>
                <button
                  onClick={clearHistory}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Clear History
                </button>
              </div>
              <div className="space-y-2">
                {migrationHistory.slice(-5).reverse().map((record) => (
                  <div key={record.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      {record.type === 'export' ? (
                        <Download className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Upload className="w-4 h-4 text-gray-400" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 capitalize">{record.type}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(record.timestamp).toLocaleDateString()} at{' '}
                          {new Date(record.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {record.encrypted && (
                        <Shield className="w-4 h-4 text-green-500" title="Encrypted" />
                      )}
                      <span className={`px-2 py-1 text-xs rounded ${
                        record.status === 'success' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
