export default defineEventHandler(async (event) => {
  try {
    // Check authentication - you'll need to be logged in to access this
    const { user } = await getUserSession(event)
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const storage = useStorage('redis')
    
    // Test basic KV operations
    const testKey = 'test-connection'
    const testValue = { 
      message: 'KV connection test', 
      timestamp: new Date().toISOString() 
    }

    // Test write
    console.log('Testing KV write...')
    await storage.setItem(testKey, testValue)
    
    // Test read
    console.log('Testing KV read...')
    const readValue = await storage.getItem(testKey)
    
    // Test keys listing
    console.log('Testing KV keys listing...')
    const keys = await storage.getKeys('temp-post:')
    
    // Cleanup
    await storage.removeItem(testKey)
    
    return {
      success: true,
      message: 'KV storage is working correctly',
      testWrite: 'OK',
      testRead: readValue ? 'OK' : 'FAILED',
      testKeys: `OK (found ${keys.length} temp posts)`,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        hasStorageKvUrl: !!process.env.STORAGE_KV_URL,
        hasStorageKvToken: !!process.env.STORAGE_KV_REST_API_TOKEN
      }
    }
  } catch (error) {
    console.error('KV test failed:', error)
    
    return {
      success: false,
      error: error.message || String(error),
      stack: error.stack,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        hasStorageKvUrl: !!process.env.STORAGE_KV_URL,
        hasStorageKvToken: !!process.env.STORAGE_KV_REST_API_TOKEN
      }
    }
  }
})