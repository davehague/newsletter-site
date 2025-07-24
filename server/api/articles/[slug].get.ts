import { getTempPostBySlug } from '~/server/utils/tempPostManager'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Slug parameter is required'
    })
  }

  try {
    // Get the database post
    const post = await getTempPostBySlug(slug)
    if (!post) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Article not found'
      })
    }

    // Only return published posts to the public
    if (post.status !== 'published') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Article not found'
      })
    }

    return {
      success: true,
      post: {
        id: post.id,
        slug: post.slug,
        title: post.title,
        description: post.description,
        content: post.content,
        publishedAt: post.publishedAt,
        tags: post.tags,
        sendAsNewsletter: post.sendAsNewsletter,
        newsletterSentAt: post.newsletterSentAt
      }
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch article',
      data: error
    })
  }
})