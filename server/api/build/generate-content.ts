import { writeFile, unlink, access } from 'fs/promises'
import { join } from 'path'
import { tempPostToMarkdown } from '~/server/utils/tempPostManager'

export default defineEventHandler(async (event) => {
  try {
    const storage = useStorage('redis')
    
    // Get all temporary posts using key index (since getKeys doesn't work with vercelKV)
    let tempPostSlugs = []
    let deletionKeys = []
    
    try {
      // Get temp post slugs from key index
      const keyIndex = await storage.getItem<string[]>('temp-post-keys') || []
      tempPostSlugs = keyIndex
      console.log(`Found ${tempPostSlugs.length} temporary posts in key index`)
      
      // For deletion keys, we still need to try getKeys or implement similar index
      // For now, skip deletion handling since it's less critical
      deletionKeys = []
      console.log('Skipping deletion markers for now (getKeys issue)')
    } catch (storageError) {
      console.error('KV Storage error in generate-content:', storageError)
      throw new Error(`Failed to access KV storage: ${storageError.message || storageError}`)
    }
    
    let processed = 0
    let deleted = 0
    let errors: string[] = []

    // Process temporary posts (convert to markdown files)
    for (const slug of tempPostSlugs) {
      try {
        const post = await storage.getItem(`temp-post:${slug}`)
        if (!post) {
          console.warn(`No post found for slug: ${slug}`)
          continue
        }

        const markdown = tempPostToMarkdown(post)
        const filePath = join(process.cwd(), 'content', 'articles', `${post.slug}.md`)
        
        await writeFile(filePath, markdown, 'utf8')
        console.log(`Generated markdown file: ${post.slug}.md`)
        
        // Remove from temporary storage
        await storage.removeItem(`temp-post:${slug}`)
        processed++
      } catch (error) {
        errors.push(`Failed to process ${slug}: ${error.message}`)
      }
    }
    
    // Update the key index to remove processed posts
    if (processed > 0) {
      try {
        const remainingSlugs = tempPostSlugs.filter(slug => {
          // Keep slugs that failed to process
          return errors.some(error => error.includes(slug))
        })
        await storage.setItem('temp-post-keys', remainingSlugs)
        console.log(`Updated key index: removed ${processed} processed posts`)
      } catch (indexError) {
        console.warn('Failed to update key index:', indexError.message)
      }
    }

    // Process deletion markers
    for (const key of deletionKeys) {
      try {
        const deleteInfo = await storage.getItem(key)
        if (!deleteInfo) continue

        const filePath = join(process.cwd(), 'content', 'articles', `${deleteInfo.slug}.md`)
        
        // Check if file exists before trying to delete
        try {
          await access(filePath)
          await unlink(filePath)
          deleted++
        } catch (accessError) {
          // File doesn't exist, that's okay
        }
        
        // Remove deletion marker
        await storage.removeItem(key)
      } catch (error) {
        errors.push(`Failed to delete ${key}: ${error.message}`)
      }
    }

    return {
      success: true,
      processed,
      deleted,
      errors,
      message: `Build generation complete: ${processed} posts processed, ${deleted} posts deleted`
    }
  } catch (error) {
    console.error('Failed to generate content:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to generate content: ${error.message || error}`,
      data: { 
        error: error.message || error,
        stack: error.stack
      }
    })
  }
})