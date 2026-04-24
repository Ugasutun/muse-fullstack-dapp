import mongoose from 'mongoose'
import { createLogger } from '@/utils/logger'

const logger = createLogger('Database')

export class DatabaseConnection {
  private static instance: DatabaseConnection
  private isConnected: boolean = false
  private connectionMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    failedConnections: 0,
    connectionErrors: [] as Array<{ timestamp: Date; error: string }>,
    lastHealthCheck: null as Date | null,
    averageResponseTime: 0,
    responseTimeHistory: [] as number[]
  }

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection()
    }
    return DatabaseConnection.instance
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('Database already connected')
      return
    }

    try {
      const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/muse'
      
      await mongoose.connect(mongoUri, {
        // Optimized connection pooling configuration
        maxPoolSize: Math.max(10, Number(process.env.DB_MAX_POOL_SIZE) || 20), // Dynamic pool size based on env
        minPoolSize: Math.max(2, Number(process.env.DB_MIN_POOL_SIZE) || 5),  // Minimum connections to maintain
        maxIdleTimeMS: Number(process.env.DB_MAX_IDLE_TIME_MS) || 30000, // Close idle connections after 30s
        serverSelectionTimeoutMS: Number(process.env.DB_SERVER_SELECTION_TIMEOUT_MS) || 5000, // Server selection timeout
        socketTimeoutMS: Number(process.env.DB_SOCKET_TIMEOUT_MS) || 45000, // Socket operation timeout
        connectTimeoutMS: Number(process.env.DB_CONNECT_TIMEOUT_MS) || 10000, // Initial connection timeout
        heartbeatFrequencyMS: Number(process.env.DB_HEARTBEAT_FREQUENCY_MS) || 10000, // Heartbeat interval
        bufferCommands: false, // Disable mongoose buffering for immediate errors
        bufferMaxEntries: 0, // Disable mongoose buffering
        waitQueueTimeoutMS: Number(process.env.DB_WAIT_QUEUE_TIMEOUT_MS) || 10000, // Connection wait timeout
        retryWrites: true, // Retry write operations on failure
        retryReads: true, // Retry read operations on failure
        readPreference: (process.env.DB_READ_PREFERENCE as any) || 'primary', // Configurable read preference
        writeConcern: {
          w: Number(process.env.DB_WRITE_CONCERN_W) || 'majority', // Write acknowledgment level
          j: process.env.DB_WRITE_CONCERN_J !== 'false', // Journal writes (default true)
          wtimeout: Number(process.env.DB_WRITE_CONCERN_TIMEOUT_MS) || 5000 // Write timeout
        },
        // Compression settings for better performance
        compressors: ['snappy', 'zlib'],
        zlibCompressionLevel: Number(process.env.DB_ZLIB_COMPRESSION_LEVEL) || 6
      })

      this.isConnected = true
      this.connectionMetrics.totalConnections++
      this.connectionMetrics.activeConnections = mongoose.connection.readyState === 1 ? 1 : 0
      logger.info('Connected to MongoDB successfully')

      // Set up connection event listeners
      mongoose.connection.on('error', (error: Error) => {
        logger.error('MongoDB connection error:', error)
        this.isConnected = false
        this.connectionMetrics.failedConnections++
        this.connectionMetrics.connectionErrors.push({
          timestamp: new Date(),
          error: error.message
        })
        // Keep only last 50 errors
        if (this.connectionMetrics.connectionErrors.length > 50) {
          this.connectionMetrics.connectionErrors = this.connectionMetrics.connectionErrors.slice(-50)
        }
      })

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected')
        this.isConnected = false
      })

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected')
        this.isConnected = true
      })

    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error)
      this.isConnected = false
      throw error
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return
    }

    try {
      await mongoose.disconnect()
      this.isConnected = false
      logger.info('Disconnected from MongoDB')
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error)
      throw error
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1
  }

  public async healthCheck(): Promise<{ status: string; responseTime?: number }> {
    const startTime = Date.now()
    
    try {
      await mongoose.connection.db?.admin().ping()
      const responseTime = Date.now() - startTime
      
      // Update metrics
      this.connectionMetrics.lastHealthCheck = new Date()
      this.connectionMetrics.responseTimeHistory.push(responseTime)
      if (this.connectionMetrics.responseTimeHistory.length > 100) {
        this.connectionMetrics.responseTimeHistory = this.connectionMetrics.responseTimeHistory.slice(-100)
      }
      this.connectionMetrics.averageResponseTime = 
        this.connectionMetrics.responseTimeHistory.reduce((a, b) => a + b, 0) / this.connectionMetrics.responseTimeHistory.length
      
      return {
        status: 'healthy',
        responseTime
      }
    } catch (error) {
      logger.error('Database health check failed:', error)
      this.connectionMetrics.lastHealthCheck = new Date()
      return {
        status: 'unhealthy'
      }
    }
  }

  public getConnectionPoolStats() {
    const poolStats = {
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      poolSize: 0,
      maxPoolSize: 50,
      minPoolSize: 5
    }

    // Get detailed pool statistics if available
    if (mongoose.connection.db) {
      const admin = mongoose.connection.db.admin()
      try {
        const serverStatus = admin.serverStatus()
        if (serverStatus && serverStatus.connections) {
          poolStats.poolSize = serverStatus.connections.current || 0
        }
      } catch (error: any) {
        logger.warn('Could not fetch pool statistics:', error)
      }
    }

    return poolStats
  }

  public getConnectionMetrics() {
    return {
      ...this.connectionMetrics,
      connectionUptime: this.isConnected ? Date.now() - (this.connectionMetrics.lastHealthCheck?.getTime() || Date.now()) : 0,
      errorRate: this.connectionMetrics.totalConnections > 0 
        ? (this.connectionMetrics.failedConnections / this.connectionMetrics.totalConnections) * 100 
        : 0,
      recentErrors: this.connectionMetrics.connectionErrors.slice(-10)
    }
  }

  public resetMetrics() {
    this.connectionMetrics = {
      totalConnections: 0,
      activeConnections: 0,
      failedConnections: 0,
      connectionErrors: [],
      lastHealthCheck: null,
      averageResponseTime: 0,
      responseTimeHistory: []
    }
    logger.info('Database connection metrics reset')
  }
}

// Export singleton instance
export const database = DatabaseConnection.getInstance()
