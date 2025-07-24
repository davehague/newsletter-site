export default defineEventHandler(async (event) => {
  // Check authentication
  const { user } = await getUserSession(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  // List all environment variables that might be related to KV
  const envVars = Object.keys(process.env)
    .filter(key => 
      key.includes('KV') || 
      key.includes('REDIS') || 
      key.includes('STORAGE') ||
      key.includes('UPSTASH')
    )
    .reduce((acc, key) => {
      // Mask sensitive values
      const value = process.env[key]
      if (key.includes('TOKEN') || key.includes('KEY') || key.includes('SECRET')) {
        acc[key] = value ? value.substring(0, 10) + '...' : 'not set'
      } else if (key.includes('URL')) {
        acc[key] = value ? value.substring(0, 30) + '...' : 'not set'
      } else {
        acc[key] = value || 'not set'
      }
      return acc
    }, {})

  return {
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    region: process.env.VERCEL_REGION,
    kvRelatedVars: envVars,
    nitroPreset: process.env.NITRO_PRESET,
    isVercel: !!process.env.VERCEL,
    count: Object.keys(envVars).length
  }
})