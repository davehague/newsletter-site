import { createHash } from 'crypto'

export interface TempPost {
  id: string
  slug: string
  title: string
  description: string
  content: string
  publishedAt: string
  tags: string[]
  sendAsNewsletter: boolean
  newsletterSentAt: string | null
  createdAt: string
  updatedAt: string
  status: 'draft' | 'pending' | 'published'
}

export interface TempPostInput {
  title: string
  description: string
  content: string
  publishedAt: string
  tags: string[]
  sendAsNewsletter: boolean
  status?: 'draft' | 'pending' | 'published'
}

/**
 * Generate a URL-safe slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Generate a unique ID for a post
 */
export function generatePostId(): string {
  return createHash('sha256')
    .update(Date.now().toString() + Math.random().toString())
    .digest('hex')
    .substring(0, 16)
}

/**
 * Get all temporary posts from KV storage
 * Uses a key index since getKeys() doesn't work reliably with vercelKV
 */
export async function getAllTempPosts(): Promise<TempPost[]> {
  try {
    const storage = useStorage('redis')
    console.log('KV: Attempting to get temporary posts using key index...')
    
    // Get the index of post keys
    let postKeys: string[] = []
    try {
      const keyIndex = await storage.getItem<string[]>('temp-post-keys') || []
      postKeys = keyIndex
      console.log(`KV: Found ${postKeys.length} keys in index`)
    } catch (indexError) {
      console.warn('KV: Key index not found or corrupted, falling back to empty array')
      postKeys = []
    }
    
    // Get each post by key
    const posts: TempPost[] = []
    const validKeys: string[] = []
    
    for (const slug of postKeys) {
      try {
        const post = await storage.getItem<TempPost>(`temp-post:${slug}`)
        if (post) {
          posts.push(post)
          validKeys.push(slug)
        } else {
          console.warn(`KV: Post not found for slug ${slug}, removing from index`)
        }
      } catch (postError) {
        console.error(`KV: Error getting post ${slug}:`, (postError as any).message)
      }
    }
    
    // Update the index to remove invalid keys
    if (validKeys.length !== postKeys.length) {
      try {
        await storage.setItem('temp-post-keys', validKeys)
        console.log(`KV: Updated key index, removed ${postKeys.length - validKeys.length} invalid keys`)
      } catch (updateError) {
        console.warn('KV: Failed to update key index:', (updateError as Error).message)
      }
    }
    
    // Sort by creation date (newest first)
    return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (error: any) {
    console.error('KV: Error in getAllTempPosts:', error)
    console.error('KV: Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    // Return empty array if KV storage fails - don't break the entire API
    return []
  }
}

/**
 * Get a temporary post by slug
 */
export async function getTempPostBySlug(slug: string): Promise<TempPost | null> {
  try {
    const storage = useStorage('redis')
    console.log(`KV: Attempting to get temporary post by slug: ${slug}`)
    const post = await storage.getItem<TempPost>(`temp-post:${slug}`)
    if (post) {
      console.log(`KV: Found temporary post for slug: ${slug}`)
    } else {
      console.log(`KV: No temporary post found for slug: ${slug}`)
    }
    return post
  } catch (error: any) {
    console.error(`KV: Error in getTempPostBySlug for slug ${slug}:`, error)
    return null
  }
}

/**
 * Create a new temporary post
 */
export async function createTempPost(data: TempPostInput): Promise<TempPost> {
  try {
    const storage = useStorage('redis')
    const id = generatePostId()
    const slug = generateSlug(data.title)
    const now = new Date().toISOString()
    
    console.log(`KV: Attempting to create new temporary post with title: "${data.title}" and slug: "${slug}"`)

    // Check if slug already exists
    const existing = await getTempPostBySlug(slug)
    if (existing) {
      console.warn(`KV: Slug conflict detected for "${slug}". Post with this title already exists.`)
      throw new Error('A post with this title already exists')
    }
    
    const post: TempPost = {
      id,
      slug,
      title: data.title,
      description: data.description,
      content: data.content,
      publishedAt: data.publishedAt,
      tags: data.tags,
      sendAsNewsletter: data.sendAsNewsletter,
      newsletterSentAt: null,
      createdAt: now,
      updatedAt: now,
      status: 'draft'
    }
    
    await storage.setItem(`temp-post:${slug}`, post)
    console.log(`KV: Successfully created and stored temporary post: ${slug}`)
    
    // Update the key index
    try {
      const keyIndex = await storage.getItem<string[]>('temp-post-keys') || []
      if (!keyIndex.includes(slug)) {
        keyIndex.push(slug)
        await storage.setItem('temp-post-keys', keyIndex)
        console.log(`KV: Added ${slug} to key index`)
      }
    } catch (indexError: any) {
      console.warn('KV: Failed to update key index:', indexError.message)
    }
    
    return post
  } catch (error: any) {
    console.error('KV: Error in createTempPost:', error)
    throw new Error(`Failed to create post: ${error.message || error}`)
  }
}

/**
 * Update an existing temporary post
 */
export async function updateTempPost(slug: string, data: Partial<TempPostInput>): Promise<TempPost> {
  try {
    const storage = useStorage('redis')
    console.log(`KV: Attempting to update temporary post with slug: ${slug}`)
    const existing = await getTempPostBySlug(slug)
    
    if (!existing) {
      console.warn(`KV: Post not found for update: ${slug}`)
      throw new Error('Post not found')
    }
    
    // If title changed, we need to update the slug
    let newSlug = slug
    if (data.title && data.title !== existing.title) {
      newSlug = generateSlug(data.title)
      console.log(`KV: Title changed for ${slug}, new slug will be ${newSlug}`)
      
      // Check if new slug conflicts
      if (newSlug !== slug) {
        const conflicting = await getTempPostBySlug(newSlug)
        if (conflicting) {
          console.warn(`KV: New slug conflict detected for "${newSlug}". Post with this title already exists.`)
          throw new Error('A post with this title already exists')
        }
        
        // Remove old entry
        await storage.removeItem(`temp-post:${slug}`)
        console.log(`KV: Removed old temporary post entry: ${slug}`)
        
        // Update key index for slug change
        try {
          const keyIndex = await storage.getItem<string[]>('temp-post-keys') || []
          const updatedIndex = keyIndex.map(key => key === slug ? newSlug : key)
          await storage.setItem('temp-post-keys', updatedIndex)
          console.log(`KV: Updated key index: ${slug} -> ${newSlug}`)
        } catch (indexError: any) {
          console.warn('KV: Failed to update key index for slug change:', indexError.message)
        }
      }
    }
    
    const updatedPost: TempPost = {
      ...existing,
      ...data,
      slug: newSlug,
      updatedAt: new Date().toISOString()
    }
    
    await storage.setItem(`temp-post:${newSlug}`, updatedPost)
    console.log(`KV: Successfully updated temporary post: ${newSlug}`)
    return updatedPost
  } catch (error: any) {
    console.error('KV: Error in updateTempPost:', error)
    throw new Error(`Failed to update post: ${error.message || error}`)
  }
}

/**
 * Delete a temporary post
 */
export async function deleteTempPost(slug: string): Promise<boolean> {
  try {
    const storage = useStorage('redis')
    console.log(`KV: Attempting to delete temporary post with slug: ${slug}`)
    const existing = await getTempPostBySlug(slug)
    
    if (!existing) {
      console.log(`KV: No temporary post found to delete for slug: ${slug}`)
      return false
    }
    
    await storage.removeItem(`temp-post:${slug}`)
    console.log(`KV: Successfully deleted temporary post: ${slug}`)
    
    // Update the key index
    try {
      const keyIndex = await storage.getItem<string[]>('temp-post-keys') || []
      const updatedIndex = keyIndex.filter(key => key !== slug)
      if (updatedIndex.length !== keyIndex.length) {
        await storage.setItem('temp-post-keys', updatedIndex)
        console.log(`KV: Removed ${slug} from key index`)
      }
    } catch (indexError: any) {
      console.warn('KV: Failed to update key index:', indexError.message)
    }
    
    return true
  } catch (error: any) {
    console.error('KV: Error in deleteTempPost:', error)
    // Return false instead of throwing to indicate deletion failed
    return false
  }
}

/**
 * Convert a temporary post to markdown file content
 */
export function tempPostToMarkdown(post: TempPost): string {
  const frontMatter = `---
title: '${post.title.replace(/'/g, "''")}'
description: '${post.description.replace(/'/g, "''")}'
publishedAt: '${post.publishedAt}'
tags: ${JSON.stringify(post.tags)}
sendAsNewsletter: ${post.sendAsNewsletter}
newsletterSentAt: ${post.newsletterSentAt}
---

${post.content}`

  return frontMatter
}

/**
 * Validate post input data
 */
export function validatePostInput(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Title is required')
  }
  
  if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
    errors.push('Description is required')
  }
  
  if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
    errors.push('Content is required')
  }
  
  if (!data.publishedAt || typeof data.publishedAt !== 'string') {
    errors.push('Published date is required')
  } else {
    const date = new Date(data.publishedAt)
    if (isNaN(date.getTime())) {
      errors.push('Published date must be a valid date')
    }
  }
  
  if (!Array.isArray(data.tags)) {
    errors.push('Tags must be an array')
  }
  
  if (typeof data.sendAsNewsletter !== 'boolean') {
    errors.push('Send as newsletter must be a boolean')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}