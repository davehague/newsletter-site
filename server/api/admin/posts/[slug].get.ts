import { getTempPostBySlug } from '~/server/utils/tempPostManager'
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

  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Slug parameter is required'
    })
  }

  try {
    // First try to get from temporary storage
    let post = await getTempPostBySlug(slug)
    
    if (post) {
      return {
        success: true,
        post: {
          ...post,
          source: 'temp',
          isPublished: false
        }
      }
    }
    
    // If not found in temp storage, try published content
    try {
      const publishedPost = await serverQueryContent(event).where({ _path: `/articles/${slug}` }).findOne()
      
      // Get the raw markdown content by reading the file directly
      const { readFile } = await import('fs/promises')
      const { join } = await import('path')
      
      let rawContent = ''
      try {
        const filePath = join(process.cwd(), 'content', 'articles', `${slug}.md`)
        const fileContent = await readFile(filePath, 'utf8')
        
        // Extract content after frontmatter
        const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
        const match = fileContent.match(frontmatterRegex)
        if (match) {
          rawContent = match[2].trim()
        }
      } catch (fileError) {
        console.error('Could not read markdown file:', fileError.message)
        // Fallback to empty content if file can't be read
        rawContent = ''
      }
      
      return {
        success: true,
        post: {
          id: publishedPost._id,
          slug: publishedPost._path?.replace('/articles/', '') || '',
          title: publishedPost.title || '',
          description: publishedPost.description || '',
          content: rawContent,
          publishedAt: publishedPost.publishedAt || '',
          tags: publishedPost.tags || [],
          sendAsNewsletter: publishedPost.sendAsNewsletter || false,
          newsletterSentAt: publishedPost.newsletterSentAt || null,
          createdAt: publishedPost.publishedAt || '',
          updatedAt: publishedPost.publishedAt || '',
          status: 'published',
          source: 'static',
          isPublished: true
        }
      }
    } catch (publishedError) {
      // Post not found in either location
      throw createError({
        statusCode: 404,
        statusMessage: 'Post not found'
      })
    }
  } catch (error: any) {
    console.error('Failed to fetch post:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch post: ${error.message || error}`,
      data: { 
        error: error.message || error,
        stack: error.stack
      }
    })
  }
})