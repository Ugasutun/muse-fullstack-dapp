import mongoose from 'mongoose'
import { User } from '../models/User'
import { Artwork } from '../models/Artwork'
import { Transaction } from '../models/Transaction'
import { Bid } from '../models/Bid'
import { Auction } from '../models/Auction'
import { Collection } from '../models/Collection'
import { Follow } from '../models/Follow'
import { Like } from '../models/Like'
import { Favorite } from '../models/Favorite'
import { Comment } from '../models/Comment'

/**
 * Migration: Add Relationship Support
 * 
 * This migration ensures all data relationships are properly established
 * and referential integrity is maintained across the database.
 * 
 * What this migration does:
 * 1. Creates indexes for virtual relationships
 * 2. Validates existing ObjectId references
 * 3. Removes orphaned records (optional - configurable)
 * 4. Updates user statistics based on actual data
 * 5. Ensures all artworks in collections exist
 */

export async function up(): Promise<void> {
  console.log('Starting relationship support migration...')

  try {
    // Step 1: Validate artwork references in transactions
    console.log('Validating artwork references in transactions...')
    const transactions = await Transaction.find({}).lean()
    const artworkIds = new Set((await Artwork.find({}, '_id').lean()).map(a => a._id.toString()))
    
    let invalidTransactions = 0
    for (const transaction of transactions) {
      if (!artworkIds.has(transaction.artwork.toString())) {
        console.log(`Warning: Transaction ${transaction._id} references non-existent artwork ${transaction.artwork}`)
        invalidTransactions++
      }
    }
    console.log(`Found ${invalidTransactions} transactions with invalid artwork references`)

    // Step 2: Validate artwork references in bids
    console.log('Validating artwork references in bids...')
    const bids = await Bid.find({}).lean()
    let invalidBids = 0
    for (const bid of bids) {
      if (!artworkIds.has(bid.artwork.toString())) {
        console.log(`Warning: Bid ${bid._id} references non-existent artwork ${bid.artwork}`)
        invalidBids++
      }
    }
    console.log(`Found ${invalidBids} bids with invalid artwork references`)

    // Step 3: Validate artwork references in auctions
    console.log('Validating artwork references in auctions...')
    const auctions = await Auction.find({}).lean()
    let invalidAuctions = 0
    for (const auction of auctions) {
      if (!artworkIds.has(auction.artwork.toString())) {
        console.log(`Warning: Auction ${auction._id} references non-existent artwork ${auction.artwork}`)
        invalidAuctions++
      }
    }
    console.log(`Found ${invalidAuctions} auctions with invalid artwork references`)

    // Step 4: Clean up artworks array in collections
    console.log('Cleaning up collection artwork references...')
    const collections = await Collection.find({})
    let cleanedCollections = 0
    for (const collection of collections) {
      const originalCount = collection.artworks.length
      collection.artworks = collection.artworks.filter(artworkId => 
        artworkIds.has(artworkId.toString())
      )
      if (collection.artworks.length !== originalCount) {
        collection.stats.totalArtworks = collection.artworks.length
        await collection.save()
        cleanedCollections++
        console.log(`Cleaned collection ${collection._id}: removed ${originalCount - collection.artworks.length} invalid references`)
      }
    }
    console.log(`Cleaned ${cleanedCollections} collections`)

    // Step 5: Update user statistics
    console.log('Updating user statistics...')
    const users = await User.find({})
    let updatedUsers = 0
    
    for (const user of users) {
      const address = user.address
      
      // Count created artworks
      const createdCount = await Artwork.countDocuments({ creator: address })
      
      // Count collected (owned) artworks
      const collectedCount = await Artwork.countDocuments({ owner: address })
      
      // Count favorites
      const favoritesCount = await Favorite.countDocuments({ user: address })
      
      // Count followers
      const followersCount = await Follow.countDocuments({ following: address, status: 'active' })
      
      // Count following
      const followingCount = await Follow.countDocuments({ follower: address, status: 'active' })
      
      // Update if any values changed
      if (
        user.stats.created !== createdCount ||
        user.stats.collected !== collectedCount ||
        user.stats.favorites !== favoritesCount ||
        user.stats.followers !== followersCount ||
        user.stats.following !== followingCount
      ) {
        user.stats.created = createdCount
        user.stats.collected = collectedCount
        user.stats.favorites = favoritesCount
        user.stats.followers = followersCount
        user.stats.following = followingCount
        await user.save()
        updatedUsers++
      }
    }
    console.log(`Updated statistics for ${updatedUsers} users`)

    // Step 6: Validate bid references in auctions
    console.log('Validating bid references in auctions...')
    const bidIds = new Set((await Bid.find({}, '_id').lean()).map(b => b._id.toString()))
    let cleanedAuctions = 0
    
    for (const auction of await Auction.find({})) {
      const originalCount = auction.bids.length
      auction.bids = auction.bids.filter(bidId => bidIds.has(bidId.toString()))
      
      if (auction.bids.length !== originalCount) {
        await auction.save()
        cleanedAuctions++
        console.log(`Cleaned auction ${auction._id}: removed ${originalCount - auction.bids.length} invalid bid references`)
      }
    }
    console.log(`Cleaned ${cleanedAuctions} auctions`)

    // Step 7: Create composite indexes (already done in models, but ensure they exist)
    console.log('Ensuring all indexes are created...')
    await User.createIndexes()
    await Artwork.createIndexes()
    await Transaction.createIndexes()
    await Bid.createIndexes()
    await Auction.createIndexes()
    await Collection.createIndexes()
    await Comment.createIndexes()
    await Like.createIndexes()
    await Favorite.createIndexes()
    await Follow.createIndexes()
    console.log('All indexes created successfully')

    console.log('Relationship support migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

export async function down(): Promise<void> {
  console.log('Rolling back relationship support migration...')
  
  // Note: This migration doesn't add new collections or fields,
  // it only validates and cleans existing data, so there's nothing to roll back
  
  console.log('Rollback completed (no-op for this migration)')
}

// Export migration metadata
export const metadata = {
  version: 3,
  name: 'add_relationship_support',
  description: 'Adds support for data relationships and validates referential integrity',
  timestamp: new Date('2024-01-20')
}
