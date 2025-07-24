#!/usr/bin/env node

import { writeFile, unlink, access, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@upstash/redis'
import { tempPostToMarkdown } from '../server/utils/tempPostManager.ts' // Adjust path as needed

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')
const contentArticlesDir = join(projectRoot, 'content', 'articles')

async function generateContent() {
  console.log('🏗️  Starting content generation from KV database...')

  if (!process.env.KV_URL || !process.env.KV_REST_TOKEN) {
    console.log('ℹ️  KV environment variables not set. Skipping database content generation')
    console.log('    Ensure KV_URL and KV_REST_TOKEN are configured for Vercel KV.')
    return
  }

  let redis
  try {
    redis = createClient({
      url: process.env.KV_URL,
      token: process.env.KV_REST_TOKEN,
    })
    console.log('✅ Successfully connected to KV (Redis).')
  } catch (error) {
    console.error('❌ Failed to connect to KV (Redis):', error.message)
    // Don't fail the build, but log the error
    return
  }

  try {
    // Ensure content/articles directory exists
    await mkdir(contentArticlesDir, { recursive: true })
    console.log(`Ensured directory exists: ${contentArticlesDir}`)

    let tempPostKeys = []
    let deletionKeys = []

    try {
      tempPostKeys = await redis.keys('temp-post:*')
      deletionKeys = await redis.keys('delete-post:*')
      console.log(`Found ${tempPostKeys.length} temporary posts and ${deletionKeys.length} deletion markers in KV.`)
    } catch (storageError) {
      console.error('❌ KV Storage error when fetching keys:', storageError.message)
      throw new Error(`Failed to access KV storage: ${storageError.message}`)
    }

    let processed = 0
    let deleted = 0
    let errors = []

    // Process temporary posts (convert to markdown files)
    for (const key of tempPostKeys) {
      try {
        const post = await redis.get(key)
        if (!post) {
          console.warn(`Skipping empty post for key: ${key}`)
          continue
        }

        const markdown = tempPostToMarkdown(post)
        const filePath = join(contentArticlesDir, `${post.slug}.md`)

        await writeFile(filePath, markdown, 'utf8')
        console.log(`📝 Wrote markdown for post: ${post.slug}.md`)

        // Remove from temporary storage
        await redis.del(key)
        console.log(`🗑️ Removed temporary post from KV: ${key}`)
        processed++
      } catch (error) {
        const errorMessage = `Failed to process ${key}: ${error.message}`
        console.error(`❌ ${errorMessage}`)
        errors.push(errorMessage)
      }
    }

    // Process deletion markers
    for (const key of deletionKeys) {
      try {
        const deleteInfo = await redis.get(key)
        if (!deleteInfo || !deleteInfo.slug) {
          console.warn(`Skipping invalid deletion marker for key: ${key}`)
          continue
        }

        const filePath = join(contentArticlesDir, `${deleteInfo.slug}.md`)

        // Check if file exists before trying to delete
        try {
          await access(filePath)
          await unlink(filePath)
          console.log(`🗑️ Deleted markdown file: ${deleteInfo.slug}.md`)
          deleted++
        } catch (accessError) {
          if (accessError.code === 'ENOENT') {
            console.log(`ℹ️ File not found for deletion (already deleted or never existed): ${deleteInfo.slug}.md`)
          } else {
            throw accessError // Re-throw other access errors
          }
        }

        // Remove deletion marker
        await redis.del(key)
        console.log(`🗑️ Removed deletion marker from KV: ${key}`)
      } catch (error) {
        const errorMessage = `Failed to delete content for ${key}: ${error.message}`
        console.error(`❌ ${errorMessage}`)
        errors.push(errorMessage)
      }
    }

    console.log(`✅ Content generation completed: ${processed} posts processed, ${deleted} posts deleted.`)
    if (errors.length > 0) {
      console.error('⚠️ Some errors occurred during content generation:')
      errors.forEach(err => console.error(`- ${err}`))
      // Exit with a non-zero code if there were errors, but don't fail the build
      // process.exit(1) // Decided against failing the build for content errors
    }
  } catch (error) {
    console.error('❌ Content generation failed entirely:', error.message)
    console.error(error.stack)
    // Don't fail the build for content generation errors
    process.exit(0)
  }
}

// Run if called directly
if (process.argv[1] === __filename) {
  generateContent()
}