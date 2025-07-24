import { getTempPostBySlug, updateTempPost } from '~/server/utils/tempPostManager'

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
    console.log(`API: Unpublishing post ${slug}...`)
    
    // Get the database post
    const post = await getTempPostBySlug(slug)
    if (!post) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Database post not found'
      })
    }

    // Update the post status to draft
    const updatedPost = await updateTempPost(slug, {
      status: 'draft'
    })
    
    console.log(`API: Marked database post as draft: ${slug}`)
    
    return {
      success: true,
      message: `Post "${post.title}" marked as draft. It's no longer publicly visible.`,
      post: updatedPost
    }
  } catch (error: any) {
    console.error('API: Failed to unpublish post:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to unpublish post: ${error.message || error}`,
      data: {
        error: error.message || error,
        stack: error.stack
      }
    })
  }
})