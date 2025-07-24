export default defineEventHandler(async (event) => {
  try {
    const storage = useStorage('redis')
    const config = useRuntimeConfig()
    
    // Check if there are any pending posts or deletion markers
    let tempPostKeys = []
    let deletePostKeys = []
    
    try {
      tempPostKeys = await storage.getKeys('temp-post:')
      deletePostKeys = await storage.getKeys('delete-post:')
    } catch (storageError) {
      console.error('KV Storage error in nightly-build:', storageError)
      throw new Error(`Failed to access KV storage: ${storageError.message || storageError}`)
    }
    
    const hasPendingChanges = tempPostKeys.length > 0 || deletePostKeys.length > 0
    
    if (!hasPendingChanges) {
      return {
        success: true,
        triggered: false,
        message: 'No pending changes, build not triggered',
        tempPosts: 0,
        deletions: 0
      }
    }
    
    // Trigger Vercel rebuild via deploy hook
    const deployHookUrl = config.deployHookUrl
    
    if (!deployHookUrl) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Deploy hook URL not configured'
      })
    }
    
    const response = await fetch(deployHookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to trigger build: ${response.status} ${response.statusText}`
      })
    }
    
    const result = await response.json()
    
    return {
      success: true,
      triggered: true,
      message: 'Build triggered successfully',
      tempPosts: tempPostKeys.length,
      deletions: deletePostKeys.length,
      deploymentUrl: result.url,
      job: result.job
    }
  } catch (error) {
    // Log error but don't fail the cron job
    console.error('Nightly build cron failed:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `Nightly build failed: ${error.message || error}`,
      data: { 
        error: error.message || error,
        stack: error.stack
      }
    })
  }
})