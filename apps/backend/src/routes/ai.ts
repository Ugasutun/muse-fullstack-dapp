import { Router } from 'express'
import { generateImage, getGenerationStatus } from '@/controllers/aiController'
import { aiStatusCache } from '@/middleware/cacheMiddleware'
import { authenticate } from '@/middleware/authMiddleware'

import { aiGenerationLimiter } from '@/middleware/rateLimitMiddleware'

const router = Router()

router.post('/generate', authenticate, aiGenerationLimiter, generateImage)
/**
 * @openapi
 * /api/ai/generate:
 *   post:
 *     summary: Generate AI art
 *     description: Start an AI art generation process (Requires Authentication)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *               model:
 *                 type: string
 *     responses:
 *       202:
 *         description: Generation started
 *       401:
 *         description: Unauthorized
 */
router.post('/generate', authenticate, generateImage)

/**
 * @openapi
 * /api/ai/status/{id}:
 *   get:
 *     summary: Get generation status
 *     description: Check the status of a specific AI generation process (Requires Authentication)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Current status of the generation
 */
router.get('/status/:id', authenticate, aiStatusCache, getGenerationStatus)

export default router
