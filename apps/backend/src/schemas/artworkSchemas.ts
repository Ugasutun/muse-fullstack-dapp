import { z } from 'zod'

export const createArtworkSchema = z.object({
  body: z.object({
    id: z.string().uuid().or(z.string().min(1)),
    title: z.string().min(1).max(100),
    description: z.string().max(1000).optional(),
    creator: z.string().regex(/^G[A-Z0-9]{55}$/, 'Invalid creator address format'),
    image: z.string().url(),
    price: z.string().regex(/^\d+(\.\d+)?$/, 'Price must be a valid number string').optional(),
    currency: z.enum(['XLM', 'ETH', 'SOL']).default('XLM'),
    metadata: z.object({
      category: z.string().optional(),
      attributes: z.record(z.any()).optional(),
      tags: z.array(z.string()).optional(),
    }).optional()
  })
})

export const updateArtworkSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(100).optional(),
    description: z.string().max(1000).optional(),
    price: z.string().regex(/^\d+(\.\d+)?$/, 'Price must be a valid number string').optional(),
    currency: z.enum(['XLM', 'ETH', 'SOL']).optional(),
    metadata: z.object({
      category: z.string().optional(),
      attributes: z.record(z.any()).optional(),
      tags: z.array(z.string()).optional(),
    }).optional()
  }),
  params: z.object({
    id: z.string().min(1)
  })
})

export const getArtworkSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
})

export const artworkQuerySchema = z.object({
  query: z.object({
    category: z.string().optional(),
    creator: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    page: z.coerce.number().int().min(1).optional()
  })
})
