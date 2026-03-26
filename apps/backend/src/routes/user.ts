import { Router } from 'express'
import { getUserProfile, updateUserProfile } from '@/controllers/userController'
import { userProfileCache } from '@/middleware/cacheMiddleware'
import { authenticate } from '@/middleware/authMiddleware'
import { validate } from '@/middleware/validate'
import { getProfileSchema, updateProfileSchema } from '@/schemas/userSchemas'

const router = Router()

router.get('/profile/:address', validate(getProfileSchema), userProfileCache, getUserProfile)
router.put('/profile/:address', authenticate, validate(updateProfileSchema), updateUserProfile)

export default router
