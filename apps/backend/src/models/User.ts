import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  address: string
  username?: string
  bio?: string
  profileImage?: string
  tier: 'free' | 'pro' | 'premium'
  stats: {
    created: number
    collected: number
    favorites: number
  }
}

const UserSchema: Schema = new Schema({
  address: { type: String, required: true, unique: true, index: true },
  username: { type: String, default: 'Anonymous Artist' },
  bio: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  tier: { 
    type: String, 
    enum: ['free', 'pro', 'premium'], 
    default: 'free' 
  },
  stats: {
    created: { type: Number, default: 0 },
    collected: { type: Number, default: 0 },
    favorites: { type: Number, default: 0 },
  },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

export default mongoose.model<IUser>('User', UserSchema)
