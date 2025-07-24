<template>
  <div class="max-w-4xl mx-auto px-4">
    <div v-if="article">
      <!-- Breadcrumbs -->
      <nav class="flex items-center space-x-2 text-sm text-slate-600 mb-8">
        <NuxtLink to="/" class="hover:text-blue-600">Home</NuxtLink>
        <span>/</span>
        <span class="text-slate-900">{{ article.title }}</span>
      </nav>

      <!-- Article Header -->
      <header class="mb-8">
        <h1 class="text-4xl font-bold text-slate-900 mb-4">
          {{ article.title }}
        </h1>
        
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <time class="text-slate-600">
            {{ formatDate(article.publishedAt) }}
          </time>
          
          <div v-if="article.tags && article.tags.length > 0" class="flex flex-wrap gap-2 mt-2 sm:mt-0">
            <NuxtLink
              v-for="tag in article.tags"
              :key="tag"
              :to="`/tags/${tag}`"
              class="text-xs font-medium px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors"
            >
              {{ tag }}
            </NuxtLink>
          </div>
        </div>

        <p class="text-lg text-slate-600">
          {{ article.description }}
        </p>
      </header>

      <!-- Article Content -->
      <article class="prose lg:prose-lg max-w-none">
        <ContentRenderer v-if="!article.isDatabase" :value="article" />
        <div v-else v-html="renderMarkdown(article.content || '')"></div>
      </article>

      <!-- Newsletter CTA -->
      <div class="bg-slate-100 rounded-lg p-8 mt-12">
        <div class="max-w-2xl mx-auto text-center">
          <h2 class="text-2xl font-semibold text-slate-900 mb-4">
            Enjoyed this article?
          </h2>
          <p class="text-slate-600 mb-6">
            Subscribe to our newsletter to get the latest articles delivered to your inbox.
          </p>
          <NuxtLink 
            to="/#subscribe"
            class="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Subscribe Now
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- 404 State -->
    <div v-else class="text-center py-12">
      <div class="text-slate-500">
        <svg class="mx-auto h-12 w-12 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h1 class="text-3xl font-bold text-slate-900 mb-2">Article Not Found</h1>
        <p class="text-slate-600 mb-6">
          The article you're looking for doesn't exist or has been moved.
        </p>
        <NuxtLink 
          to="/"
          class="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
        >
          Go Home
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const slugPath = route.params.slug ? Array.isArray(route.params.slug) ? route.params.slug.join('/') : route.params.slug : ''

// First try to find in static content
let article = await queryContent('articles', slugPath).findOne().catch(() => null)

// If not found in static content, check published database posts
if (!article) {
  try {
    const dbPost = await $fetch(`/api/articles/${slugPath}`)
    if (dbPost && dbPost.success) {
      article = {
        title: dbPost.post.title,
        description: dbPost.post.description,
        publishedAt: dbPost.post.publishedAt,
        tags: dbPost.post.tags,
        content: dbPost.post.content, // Raw markdown content
        _path: `/articles/${dbPost.post.slug}`,
        isDatabase: true // Flag to identify database posts
      }
    }
  } catch (error) {
    // Database post not found either
  }
}

if (!article) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Article not found'
  })
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const renderMarkdown = (markdown) => {
  // Simple markdown to HTML conversion for database posts
  if (!markdown) return ''
  
  return markdown
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/\n\n/gim, '</p><p>')
    .replace(/\n/gim, '<br>')
    .replace(/^(?!<[h|p|b])(.+)/gim, '<p>$1</p>')
    .replace(/<p><\/p>/gim, '') // Remove empty paragraphs
}

useSeoMeta({
  title: `${article.title} - My Newsletter`,
  ogTitle: `${article.title} - My Newsletter`,
  description: article.description,
  ogDescription: article.description
})
</script>