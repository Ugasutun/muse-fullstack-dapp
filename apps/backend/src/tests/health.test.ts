import request from 'supertest'
import app from '@/index'

describe('Health Check Endpoints', () => {
  describe('GET /health', () => {
    it('should return comprehensive health check', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)

      expect(response.body).toHaveProperty('status')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('service', 'muse-backend')
      expect(response.body).toHaveProperty('uptime')
      expect(response.body).toHaveProperty('checks')
      expect(response.body).toHaveProperty('summary')

      const { checks } = response.body
      expect(checks).toHaveProperty('database')
      expect(checks).toHaveProperty('cache')
      expect(checks).toHaveProperty('stellar')
      expect(checks).toHaveProperty('aiServices')

      const { summary } = response.body
      expect(summary).toHaveProperty('total')
      expect(summary).toHaveProperty('healthy')
      expect(summary).toHaveProperty('unhealthy')
      expect(summary).toHaveProperty('degraded')
    })
  })

  describe('GET /ready', () => {
    it('should return readiness status', async () => {
      const response = await request(app)
        .get('/ready')
        .expect(200)

      expect(response.body).toHaveProperty('ready')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('checks')
      
      const { checks } = response.body
      expect(checks).toHaveProperty('database')
      expect(checks).toHaveProperty('cache')
    })
  })

  describe('GET /live', () => {
    it('should return liveness status', async () => {
      const response = await request(app)
        .get('/live')
        .expect(200)

      expect(response.body).toHaveProperty('alive', true)
      expect(response.body).toHaveProperty('timestamp')
    })
  })

  describe('GET /health/simple', () => {
    it('should return simple health check for backward compatibility', async () => {
      const response = await request(app)
        .get('/health/simple')
        .expect(200)

      expect(response.body).toHaveProperty('status', 'OK')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('service', 'muse-backend')
    })
  })
})
