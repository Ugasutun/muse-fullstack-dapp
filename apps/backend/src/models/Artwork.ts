import mongoose, { Schema, Document } from 'mongoose'

export interface IArtwork extends Document {
  title: string
  description: string
  imageUrl: string
  price: string
  currency: string
  creator: string
  owner?: string
  category: string
  prompt?: string
  aiModel?: string
  tokenId?: string
  isListed?: boolean
  metadata?: {
    attributes?: Array<{
      trait_type: string
      value: string | number
      display_type?: 'number' | 'date' | 'string'
    }>
    externalUrl?: string
    backgroundColor?: string
  }
  createdAt: Date
  updatedAt: Date
}

const ArtworkSchema = new Schema<IArtwork>({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  price: { type: String, required: true },
  currency: { type: String, default: 'XLM' },
  creator: { type: String, required: true, index: true },
  owner: { type: String, index: true },
  category: { type: String, required: true, index: true },
  prompt: String,
  aiModel: String,
  tokenId: String,
  isListed: { type: Boolean, default: true, index: true },
  metadata: {
    attributes: [{
      trait_type: String,
      value: Schema.Types.Mixed,
      display_type: { type: String, enum: ['number', 'date', 'string'] }
    }],
    externalUrl: String,
    backgroundColor: String
  }
}, {
  timestamps: true
})

// Indexes for performance
ArtworkSchema.index({ category: 1, isListed: 1, createdAt: -1 })
ArtworkSchema.index({ creator: 1, createdAt: -1 })
ArtworkSchema.index({ price: 1 })
ArtworkSchema.index({ createdAt: -1 })

// Virtual relationships
ArtworkSchema.virtual('transactions', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'artwork',
  justOne: false
})

ArtworkSchema.virtual('bids', {
  ref: 'Bid',
  localField: '_id',
  foreignField: 'artwork',
  justOne: false
})

ArtworkSchema.virtual('auction', {
  ref: 'Auction',
  localField: '_id',
  foreignField: 'artwork',
  justOne: true
})

ArtworkSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'artwork',
  justOne: false
})

ArtworkSchema.virtual('likes', {
  ref: 'Like',
  localField: '_id',
  foreignField: 'artwork',
  justOne: false
})

ArtworkSchema.virtual('favorites', {
  ref: 'Favorite',
  localField: '_id',
  foreignField: 'artwork',
  justOne: false
})

// Cascade delete related entities when artwork is deleted
ArtworkSchema.pre('deleteOne', { document: true, query: false }, async function() {
  const artworkId = this._id
  
  // Delete related transactions
  await mongoose.model('Transaction').deleteMany({ artwork: artworkId })
  
  // Delete related bids
  await mongoose.model('Bid').deleteMany({ artwork: artworkId })
  
  // Delete related auction
  await mongoose.model('Auction').deleteOne({ artwork: artworkId })
  
  // Delete related comments
  await mongoose.model('Comment').deleteMany({ artwork: artworkId })
  
  // Delete related likes
  await mongoose.model('Like').deleteMany({ artwork: artworkId })
  
  // Delete related favorites
  await mongoose.model('Favorite').deleteMany({ artwork: artworkId })
  
  // Remove from collections
  await mongoose.model('Collection').updateMany(
    { artworks: artworkId },
    { $pull: { artworks: artworkId } }
  )
})

// Enable virtuals in JSON/Object output
ArtworkSchema.set('toJSON', { virtuals: true })
ArtworkSchema.set('toObject', { virtuals: true })

export const Artwork = mongoose.model<IArtwork>('Artwork', ArtworkSchema)