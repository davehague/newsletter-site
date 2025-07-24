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
    const config = useRuntimeConfig()
    const deployHookUrl = config.deployHookUrl
    
    // In production, trigger actual deployment
    if (process.env.NODE_ENV === 'production' && deployHookUrl) {
      const response = await fetch(deployHookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw createError({
          statusCode: 500,
          statusMessage: `Deploy hook failed: ${response.status} ${response.statusText}`
        })
      }
      
      const result = await response.json()
      
      return {
        success: true,
        message: 'Build triggered successfully',
        deploymentUrl: result.url,
        job: result.job
      }
    } else {
      // In development or if no deploy hook, run content generation directly
      console.log('Running content generation directly...')
      
      const { default: generateContent } = await import('~/server/api/build/generate-content')
      const result = await generateContent(event)
      
      return {
        success: true,
        message: result.message || 'Content generation completed',
        processed: result.processed,
        deleted: result.deleted,
        errors: result.errors
      }
    }
  } catch (error: any) {
    console.error('Build trigger failed:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to trigger build: ${error.message || error}`,
      data: {
        error: error.message || error,
        stack: error.stack
      }
    })
  }
})