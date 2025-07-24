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
    const storage = useStorage('redis')
    
    // Test 1: Can we access storage?
    let storageTest = { success: false, error: null }
    try {
      await storage.setItem('test-key', 'test-value')
      const value = await storage.getItem('test-key')
      await storage.removeItem('test-key')
      storageTest.success = true
    } catch (e) {
      storageTest.error = e.message
    }

    // Test 2: Can we list keys?
    let keysTest = { success: false, keys: [], error: null }
    try {
      const keys = await storage.getKeys('temp-post:')
      keysTest.success = true
      keysTest.keys = keys
    } catch (e) {
      keysTest.error = e.message
    }

    // Test 3: Can we get individual posts?
    let postsTest = { success: false, posts: [], error: null }
    try {
      if (keysTest.keys.length > 0) {
        for (const key of keysTest.keys.slice(0, 3)) { // Get first 3
          const post = await storage.getItem(key)
          if (post) {
            postsTest.posts.push({ key, post })
          }
        }
        postsTest.success = true
      }
    } catch (e) {
      postsTest.error = e.message
    }

    // Test 4: Test getAllTempPosts function
    let getAllTest = { success: false, count: 0, error: null }
    try {
      const { getAllTempPosts } = await import('~/server/utils/tempPostManager')
      const posts = await getAllTempPosts()
      getAllTest.success = true
      getAllTest.count = posts.length
    } catch (e) {
      getAllTest.error = e.message
    }

    return {
      storageTest,
      keysTest,
      postsTest,
      getAllTest,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        hasUrl: !!process.env.STORAGE_KV_REST_API_URL,
        hasToken: !!process.env.STORAGE_KV_REST_API_TOKEN
      }
    }
  } catch (error) {
    return {
      error: error.message,
      stack: error.stack
    }
  }
})