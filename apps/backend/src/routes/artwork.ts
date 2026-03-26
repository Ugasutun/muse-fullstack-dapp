import { Router } from 'express'
import * as artworkController from '@/controllers/artworkController'
import { artworkListCache, artworkDetailCache } from '@/middleware/cacheMiddleware'
import { authenticate } from '@/middleware/authMiddleware'
import { validate } from '@/middleware/validate'
import { 
  createArtworkSchema, 
  updateArtworkSchema, 
  getArtworkSchema, 
  artworkQuerySchema 
} from '@/schemas/artworkSchemas'

const router = Router()

// Public routes with caching and validation
router.get('/', validate(artworkQuerySchema), artworkListCache, artworkController.getArtworks)
router.get('/:id', validate(getArtworkSchema), artworkDetailCache, artworkController.getArtworkById)

// Protected routes (require auth)
router.post('/', authenticate, validate(createArtworkSchema), artworkController.createArtwork)
router.put('/:id', authenticate, validate(updateArtworkSchema), artworkController.updateArtwork)
router.delete('/:id', authenticate, validate(getArtworkSchema), artworkController.deleteArtwork)

export default router
