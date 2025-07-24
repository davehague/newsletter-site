// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-22',
  devtools: { enabled: true },
  modules: [
    '@nuxt/content',
    '@nuxtjs/tailwindcss',
    'nuxt-auth-utils'
  ],
  content: {
    // Content configuration for Nuxt 3
  },
  typescript: {
    typeCheck: false
  },
  nitro: {
    storage: {
      redis: process.env.NODE_ENV === 'development' 
        ? {
            driver: 'fs',
            base: './.tmp/storage'
          }
        : {
            driver: 'vercelKV',
            // Try both with and without explicit env vars
            ...(process.env.STORAGE_KV_REST_API_URL && {
              url: process.env.STORAGE_KV_REST_API_URL,
              token: process.env.STORAGE_KV_REST_API_TOKEN,
              env: false // Disable automatic env var reading
            })
          }
    }
  },
  hooks: {
    'build:before': async () => {
      // Generate content from database before build (only in production)
      if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV) {
        try {
          console.log('🏗️  Generating content from database...')
          // We need to import the utilities directly since we're in build context
          const { getAllTempPosts, tempPostToMarkdown } = await import('./server/utils/tempPostManager')
          const { writeFile, unlink, access } = await import('fs/promises')
          const { join } = await import('path')
          
          // This is a simplified version for the build hook
          // The full logic is in the API endpoint
          console.log('✅ Content generation hook registered')
        } catch (error) {
          console.warn('⚠️  Content generation hook failed:', error.message)
        }
      }
    }
  },
  runtimeConfig: {
    // Private keys (only available on the server-side)
    mailjetApiKey: process.env.MAILJET_API_KEY || '',
    mailjetSecretKey: process.env.MAILJET_SECRET_KEY || '',
    mailjetListId: process.env.MAILJET_LIST_ID || '',
    fromEmail: process.env.FROM_EMAIL || 'newsletter@example.com',
    fromName: process.env.FROM_NAME || 'Your Newsletter',
    testEmail: process.env.TEST_EMAIL || '',
    deployHookUrl: process.env.VERCEL_DEPLOY_HOOK_URL || '',
    // Public keys (exposed to the client-side)
    public: {
      siteUrl: process.env.SITE_URL || 'https://your-site.vercel.app'
    }
  }
})