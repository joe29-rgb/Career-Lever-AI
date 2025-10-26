import { beforeAll, afterAll, afterEach } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

let mongoServer: MongoMemoryServer

// Setup in-memory MongoDB for tests
beforeAll(async () => {
  try {
    mongoServer = await MongoMemoryServer.create()
    const mongoUri = mongoServer.getUri()
    await mongoose.connect(mongoUri)
    console.log('✅ Test database connected')
  } catch (error) {
    console.error('❌ Test database connection failed:', error)
  }
})

// Cleanup after each test
afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections
    for (const key in collections) {
      await collections[key].deleteMany({})
    }
  }
})

// Teardown after all tests
afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect()
  }
  if (mongoServer) {
    await mongoServer.stop()
  }
  console.log('✅ Test database disconnected')
})

// Mock environment variables (only in test environment)
if (process.env.NODE_ENV !== 'production') {
  process.env.MONGODB_URI = 'mongodb://localhost:27017/test'
  process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only'
  process.env.NEXTAUTH_URL = 'http://localhost:3000'
  process.env.PERPLEXITY_API_KEY = 'test-perplexity-key'
}

