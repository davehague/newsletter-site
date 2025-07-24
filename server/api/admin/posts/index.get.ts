import { getAllTempPosts } from '~/server/utils/tempPostManager'
import { serverQueryContent } from '#content/server'

export default defineEventHandler(async (event) => {
  // Check authentication
  const { user } = await getUserSession(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  try {
    console.log('API: Fetching posts...')
    
    // Get all temporary posts from KV storage
    const tempPosts = await getAllTempPosts()
    console.log(`API: Found ${tempPosts.length} temporary posts`)
    
    // Get published posts from content
    let publishedPosts = []
    try {
      publishedPosts = await serverQueryContent(event).where({ _path: /^\/articles/ }).find()
      console.log(`API: Found ${publishedPosts.length} published posts`)
    } catch (contentError) {
      console.error('API: Error fetching published posts:', contentError)
      // Continue with empty published posts array
    }
    
    // Combine and format
    const allPosts = [
      // Database posts (fully editable)
      ...tempPosts.map(post => ({
        ...post,
        source: 'database' as const,
        isPublished: false,
        isEditable: true,
        isDeletable: true
      })),
      // Static posts (read-only)
      ...publishedPosts.map(post => ({
        id: post._id,
        slug: post._path?.replace('/articles/', '') || '',
        title: post.title || '',
        description: post.description || '',
        publishedAt: post.publishedAt || '',
        tags: post.tags || [],
        sendAsNewsletter: post.sendAsNewsletter || false,
        newsletterSentAt: post.newsletterSentAt || null,
        createdAt: post.publishedAt || '',
        updatedAt: post.publishedAt || '',
        status: 'published' as const,
        source: 'static' as const,
        isPublished: true,
        isEditable: false,
        isDeletable: false
      }))
    ]
    
    // Sort by updated date (newest first)
    allPosts.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt).getTime()
      const dateB = new Date(b.updatedAt || b.createdAt).getTime()
      return dateB - dateA
    })
    
    return {
      success: true,
      posts: allPosts,
      total: allPosts.length,
      tempCount: tempPosts.length,
      publishedCount: publishedPosts.length
    }
  } catch (error) {
    console.error('Failed to fetch posts:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch posts: ${error.message || error}`,
      data: { 
        error: error.message || error,
        stack: error.stack
      }
    })
  }
})