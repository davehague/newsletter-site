export default defineEventHandler(async (event) => {
  // Check authentication
  const { user } = await getUserSession(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const results = {
    envCheck: {
      hasUrl: !!process.env.STORAGE_KV_REST_API_URL,
      hasToken: !!process.env.STORAGE_KV_REST_API_TOKEN,
      urlPrefix: process.env.STORAGE_KV_REST_API_URL?.substring(0, 30) + '...',
      tokenPrefix: process.env.STORAGE_KV_REST_API_TOKEN?.substring(0, 10) + '...'
    },
    tests: []
  }

  // Test 1: Direct storage access with timeout
  try {
    console.log('Starting KV test...')
    const storage = useStorage('redis')
    
    // Add a timeout wrapper
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out after 5s')), 5000)
    )
    
    const testPromise = (async () => {
      console.log('Setting test item...')
      await storage.setItem('simple-test', { test: true, time: new Date().toISOString() })
      console.log('Getting test item...')
      const result = await storage.getItem('simple-test')
      console.log('Removing test item...')
      await storage.removeItem('simple-test')
      return result
    })()
    
    const result = await Promise.race([testPromise, timeoutPromise])
    results.tests.push({ name: 'basic-storage', success: true, result })
  } catch (error) {
    console.error('Simple KV test error:', error)
    results.tests.push({ 
      name: 'basic-storage', 
      success: false, 
      error: error.message,
      stack: error.stack
    })
  }

  // Test 2: Try to get keys with timeout
  try {
    const storage = useStorage('redis')
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Keys operation timed out after 5s')), 5000)
    )
    
    const keysPromise = storage.getKeys('')
    const keys = await Promise.race([keysPromise, timeoutPromise])
    
    results.tests.push({ 
      name: 'get-keys', 
      success: true, 
      count: keys.length,
      sample: keys.slice(0, 5)
    })
  } catch (error) {
    console.error('Get keys error:', error)
    results.tests.push({ 
      name: 'get-keys', 
      success: false, 
      error: error.message 
    })
  }

  return results
})