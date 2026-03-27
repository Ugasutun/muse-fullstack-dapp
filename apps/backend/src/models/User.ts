import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
  address: string
  username: string
  email?: string
  bio?: string
  profileImage?: string
  avatar?: string
  bannerImage?: string
  banner?: string
  website?: string
  twitter?: string
  discord?: string
  tier: 'free' | 'pro' | 'premium'
  isVerified: boolean
  stats?: {
    artworks?: number
    sales?: number
    created?: number
    collected?: number
    favorites?: number
    totalSales?: string
    totalPurchases?: string
    followers?: number
    following?: number
  }
  preferences?: {
    notifications?: {
      email?: boolean
      push?: boolean
    }
    privacy?: {
      profileVisibility?: 'public' | 'private'
      showEmail?: boolean
    }
    display?: string
    theme?: string
    currency?: string
    language?: string
  }
  createdAt: Date
  updatedAt: Date
}

const UserSchema: Schema = new Schema(
  {
    address: { type: String, required: true, unique: true, index: true, trim: true },
    username: { type: String, required: true, trim: true, index: true },
    email: { type: String, sparse: true, trim: true, lowercase: true },
    bio: { type: String, trim: true, maxlength: 500 },
    profileImage: { type: String },
    avatar: { type: String },
    bannerImage: { type: String },
    banner: { type: String },
    website: { type: String },
    twitter: { type: String },
    discord: { type: String },
    tier: {
      type: String,
      enum: ['free', 'pro', 'premium'],
      default: 'free',
    },
    isVerified: { type: Boolean, default: false },
    stats: {
      artworks: { type: Number, default: 0 },
      sales: { type: Number, default: 0 },
      created: { type: Number, default: 0 },
      collected: { type: Number, default: 0 },
      favorites: { type: Number, default: 0 },
      totalSales: { type: String, default: '0' },
      totalPurchases: { type: String, default: '0' },
      followers: { type: Number, default: 0 },
      following: { type: Number, default: 0 },
    },
    preferences: {
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
      },
      privacy: {
        profileVisibility: {
          type: String,
          enum: ['public', 'private'],
          default: 'public',
        },
        showEmail: { type: Boolean, default: false },
      },
      display: { type: String, default: 'grid' },
      theme: { type: String, default: 'dark' },
      currency: { type: String, default: 'XLM' },
      language: { type: String, default: 'en' },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Indexes for performance
UserSchema.index({ username: 1 })
UserSchema.index({ address: 1 })
UserSchema.index({ 'stats.followers': -1 })

export const User = mongoose.model<IUser>('User', UserSchema)
export default User
