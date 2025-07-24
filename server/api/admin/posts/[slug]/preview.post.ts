import { marked } from 'marked'

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
    
    if (!body.content || typeof body.content !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Content is required for preview'
      })
    }
    
    // Convert markdown to HTML for preview
    const htmlContent = marked(body.content)
    
    return {
      success: true,
      preview: {
        title: body.title || 'Untitled',
        description: body.description || '',
        publishedAt: body.publishedAt || new Date().toISOString().split('T')[0],
        tags: body.tags || [],
        sendAsNewsletter: body.sendAsNewsletter || false,
        content: htmlContent
      }
    }
  } catch (error: any) {
    console.error('Failed to generate preview:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to generate preview: ${error.message || error}`,
      data: { 
        error: error.message || error,
        stack: error.stack
      }
    })
  }
})