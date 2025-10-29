import mongoose from 'mongoose'

interface DatabaseConfig {
  uri: string
  options: mongoose.ConnectOptions
}

class DatabaseService {
  private static instance: DatabaseService
  private connection: mongoose.Connection | null = null
  private isConnecting = false

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  async connect(): Promise<mongoose.Connection> {
    if (this.connection?.readyState === 1) {
      return this.connection
    }

    if (this.isConnecting) {
      // Wait for existing connection attempt
      return new Promise((resolve, reject) => {
        const checkConnection = () => {
          if (this.connection?.readyState === 1) {
            resolve(this.connection)
          } else if (!this.isConnecting) {
            reject(new Error('Connection failed'))
          } else {
            setTimeout(checkConnection, 100)
          }
        }
        checkConnection()
      })
    }

    const config = this.getConfig()
    if (!config.uri) {
      throw new Error('MONGODB_URI not configured')
    }
    
    // Validate MongoDB URI format
    if (!config.uri.startsWith('mongodb://') && !config.uri.startsWith('mongodb+srv://')) {
      throw new Error('Invalid MONGODB_URI format - must start with mongodb:// or mongodb+srv://')
    }

    this.isConnecting = true

    try {
      await mongoose.connect(config.uri, config.options)
      this.connection = mongoose.connection
      this.isConnecting = false

      this.connection.on('error', (error) => {
        console.error('MongoDB connection error:', error)
      })

      this.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected - attempting reconnection')
        this.connection = null
        // Attempt reconnection after 5 seconds
        setTimeout(() => {
          console.log('Attempting to reconnect to MongoDB...')
          this.connect().catch(err => console.error('Reconnection failed:', err))
        }, 5000)
      })

      console.log('Connected to MongoDB')
      return this.connection

    } catch (error) {
      this.isConnecting = false
      console.error('MongoDB connection failed:', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await mongoose.disconnect()
      this.connection = null
    }
  }

  private getConfig(): DatabaseConfig {
    return {
      uri: process.env.MONGODB_URI!,
      options: {
        // Connection pooling
        bufferCommands: false,
        maxPoolSize: 10,
        minPoolSize: 2,
        
        // Timeouts
        serverSelectionTimeoutMS: 15000, // Increased from 5s to 15s for cold starts
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        
        // Network
        family: 4,
        
        // Reliability
        retryWrites: true,
        retryReads: true,
        
        // Write concern
        writeConcern: {
          w: 'majority',
          wtimeout: 5000
        },
        
        // Read preference for better load distribution
        readPreference: 'primaryPreferred',
        
        // Index management
        autoIndex: process.env.NODE_ENV !== 'production', // Disable in production for performance
        autoCreate: process.env.NODE_ENV !== 'production',
        
        // Compression for better network performance
        compressors: ['zlib']
      }
    }
  }

  getConnection(): mongoose.Connection | null {
    return this.connection
  }

  isConnected(): boolean {
    return this.connection?.readyState === 1
  }
}

// Export singleton instance
export const dbService = DatabaseService.getInstance()

// Legacy compatibility
export default async function connectToDatabase() {
  return dbService.connect()
}
