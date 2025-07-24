import { getTempPostBySlug, updateTempPost, createTempPost, validatePostInput } from '~/server/utils/tempPostManager'
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
    const body = await readBody(event)
    
    // Validate input
    const validation = validatePostInput(body)
    if (!validation.valid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid input',
        data: { errors: validation.errors }
      })
    }
    
    // Check if post exists in temporary storage
    const existingTemp = await getTempPostBySlug(slug)
    
    if (existingTemp) {
      // Update existing temporary post
      const updatedPost = await updateTempPost(slug, body)
      
      return {
        success: true,
        post: updatedPost,
        message: 'Post updated successfully.'
      }
    }
    
    // If post doesn't exist in temp storage, check if it's a published post
    // In this case, create a new temp version to override the published one
    try {
      await serverQueryContent(event).where({ _path: `/articles/${slug}` }).findOne()
      
      // Published post exists, create temporary version
      const newTempPost = await createTempPost(body)
      
      return {
        success: true,
        post: newTempPost,
        message: 'Database copy created. This will override the static version when viewed.'
      }
    } catch {
      // Post doesn't exist at all
      throw createError({
        statusCode: 404,
        statusMessage: 'Post not found'
      })
    }
  } catch (error: any) {
    console.error('Failed to update post:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to update post: ${error.message || error}`,
      data: { 
        error: error.message || error,
        stack: error.stack
      }
    })
  }
})