import { deleteTempPost } from '~/server/utils/tempPostManager'
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
    // First check if it's in temporary storage
    const deleted = await deleteTempPost(slug)
    
    if (deleted) {
      return {
        success: true,
        message: 'Temporary post deleted successfully.'
      }
    }
    
    // If not in temp storage, check if it's a published post
    try {
      await serverQueryContent(event).where({ _path: `/articles/${slug}` }).findOne()
      
      // Published post exists - we can't directly delete it from the filesystem
      // in a serverless environment, so we'll create a "deletion marker"
      // that will be processed during the next build
      
      try {
        const storage = useStorage('redis')
        await storage.setItem(`delete-post:${slug}`, {
          slug,
          deletedAt: new Date().toISOString(),
          originalPost: true
        })
      } catch (storageError) {
        console.error('Failed to create deletion marker:', storageError)
        throw new Error(`Failed to mark post for deletion: ${storageError.message || storageError}`)
      }
      
      return {
        success: true,
        message: 'Static post cannot be deleted. Create a database copy to override it instead.'
      }
    } catch {
      // Post doesn't exist at all
      throw createError({
        statusCode: 404,
        statusMessage: 'Post not found'
      })
    }
  } catch (error: any) {
    console.error('Failed to delete post:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to delete post: ${error.message || error}`,
      data: { 
        error: error.message || error,
        stack: error.stack
      }
    })
  }
})