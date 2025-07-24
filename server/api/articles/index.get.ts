import { getAllTempPosts } from '~/server/utils/tempPostManager'
import { serverQueryContent } from '#content/server'

export default defineEventHandler(async (event) => {
  try {
    // Get published database posts
    const dbPosts = await getAllTempPosts()
    const publishedDbPosts = dbPosts.filter(post => post.status === 'published')
    
    // Get static posts from content
    let staticPosts = []
    try {
      staticPosts = await serverQueryContent(event).where({ _path: /^\/articles/ }).find()
    } catch (contentError) {
      console.warn('Failed to load static content:', contentError)
    }
    
    // Combine and format all posts
    const allPosts = [
      // Published database posts
      ...publishedDbPosts.map(post => ({
        _path: `/articles/${post.slug}`,
        title: post.title,
        description: post.description,
        publishedAt: post.publishedAt,
        tags: post.tags,
        source: 'database'
      })),
      // Static posts
      ...staticPosts.map(post => ({
        _path: post._path,
        title: post.title,
        description: post.description,
        publishedAt: post.publishedAt,
        tags: post.tags || [],
        source: 'static'
      }))
    ]
    
    // Sort by published date (newest first)
    allPosts.sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime()
      const dateB = new Date(b.publishedAt).getTime()
      return dateB - dateA
    })
    
    return {
      success: true,
      articles: allPosts,
      total: allPosts.length,
      dbPosts: publishedDbPosts.length,
      staticPosts: staticPosts.length
    }
  } catch (error: any) {
    console.error('Failed to fetch articles:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch articles',
      data: error
    })
  }
})