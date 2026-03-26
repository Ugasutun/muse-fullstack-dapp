import { z } from 'zod'

export const updateProfileSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(50).optional(),
    bio: z.string().max(300).optional(),
    profileImage: z.string().url().optional(),
  }),
  params: z.object({
    address: z.string().regex(/^G[A-Z0-9]{55}$/, 'Invalid Stellar address format'),
  })
})

export const getProfileSchema = z.object({
  params: z.object({
    address: z.string().regex(/^G[A-Z0-9]{55}$/, 'Invalid Stellar address format'),
  })
})
