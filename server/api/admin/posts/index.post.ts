import { createTempPost, validatePostInput } from '~/server/utils/tempPostManager'

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
    
    // Create the temporary post
    const newPost = await createTempPost(body)
    
    return {
      success: true,
      post: newPost,
      message: 'Post created successfully and saved to database.'
    }
  } catch (error: any) {
    console.error('API: Failed to create post:', error)
    
    if (error.statusCode) {
      // If it's an already structured error (e.g., 400 from validation), re-throw it
      throw error
    }

    // Check for specific error messages from tempPostManager
    if (error.message && error.message.includes('A post with this title already exists')) {
      throw createError({
        statusCode: 409, // Conflict
        statusMessage: 'Post with this title already exists. Please choose a different title.',
        data: {
          error: error.message,
          stack: error.stack
        }
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `Internal Server Error: Failed to create post.`,
      data: {
        error: error.message || 'Unknown error',
        stack: error.stack
      }
    })
  }
})