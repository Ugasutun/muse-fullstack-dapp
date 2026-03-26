import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import dotenv from 'dotenv'
import { errorHandler } from '@/middleware/errorHandler'
import { notFound } from '@/middleware/notFound'
import cacheService from '@/services/cacheService'
import { createLogger } from '@/utils/logger'
import artworkRoutes from '@/routes/artwork'
import userRoutes from '@/routes/user'
import aiRoutes from '@/routes/ai'
import metadataRoutes from '@/routes/metadata'
import cacheRoutes from '@/routes/cache'
import authRoutes from '@/routes/auth'
import imageOptimizerRoutes from '@/routes/imageOptimizer'
import { authenticate, optionalAuthenticate } from '@/middleware/authMiddleware'
import { standardLimiter } from '@/middleware/rateLimitMiddleware'

import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

import mongoose from 'mongoose'

dotenv.config()

const logger = createLogger('Server')

const app = express()
const PORT = process.env.PORT || 5000
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/muse'

// Swagger configuration
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Muse AI Art Marketplace API',
      version: '1.0.0',
      description: 'API documentation for the Muse AI Art Marketplace backend',
      contact: {
        name: 'Muse Developer',
        url: 'https://muse-marketplace.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts'], // Path to the API docs
}

const swaggerSpec = swaggerJsdoc(swaggerOptions)

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => logger.info('✅ Successfully connected to MongoDB'))
  .catch((err) => logger.error('❌ Error connecting to MongoDB:', err))

app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(compression())
app.use(morgan('combined'))
app.use(optionalAuthenticate)
app.use(standardLimiter)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'muse-backend',
  })
})

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use('/api/artworks', artworkRoutes)
app.use('/api/users', userRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/metadata', metadataRoutes)
app.use('/api/cache', cacheRoutes)
app.use('/api/auth', authRoutes)
app.use('/api', imageOptimizerRoutes)

app.use(notFound)
app.use(errorHandler)

app.listen(PORT, () => {
  logger.info(`🚀 Muse Backend API running on port ${PORT}`)
  logger.info(`📊 Health check: http://localhost:${PORT}/health`)
  logger.info(`🗄️ Cache stats: ${JSON.stringify(cacheService.getCacheStats())}`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  await cacheService.disconnect()
  await mongoose.disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully')
  await cacheService.disconnect()
  await mongoose.disconnect()
  process.exit(0)
})

export default app
