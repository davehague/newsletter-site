<template>
  <div class="max-w-4xl mx-auto px-4">
    <div class="mb-8">
      <nav class="flex items-center space-x-2 text-sm text-slate-600 mb-4">
        <NuxtLink to="/" class="hover:text-blue-600">Home</NuxtLink>
        <span>/</span>
        <NuxtLink to="/tags" class="hover:text-blue-600">Tags</NuxtLink>
        <span>/</span>
        <span class="text-slate-900">{{ $route.params.tag }}</span>
      </nav>
      
      <h1 class="text-3xl font-bold text-slate-900 mb-2">
        Articles tagged with "{{ $route.params.tag }}"
      </h1>
      <p class="text-lg text-slate-600">
        {{ filteredArticles.length }} article{{ filteredArticles.length !== 1 ? 's' : '' }} found
      </p>
    </div>

    <div v-if="filteredArticles.length > 0" class="space-y-6">
      <article 
        v-for="article in filteredArticles" 
        :key="article._path"
        class="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition-shadow"
      >
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3">
          <h2 class="text-xl font-semibold text-slate-900 mb-2">
            <NuxtLink 
              :to="article._path"
              class="hover:text-blue-600 transition-colors"
            >
              {{ article.title }}
            </NuxtLink>
          </h2>
          <time class="text-sm text-slate-500">
            {{ formatDate(article.publishedAt) }}
          </time>
        </div>
        
        <p class="text-slate-600 mb-4">
          {{ article.description }}
        </p>
        
        <div class="flex flex-wrap gap-2">
          <span 
            v-for="tag in article.tags" 
            :key="tag"
            :class="[
              'text-xs font-medium px-2.5 py-0.5 rounded-full',
              tag === $route.params.tag 
                ? 'bg-blue-600 text-white' 
                : 'bg-blue-100 text-blue-800'
            ]"
          >
            <NuxtLink 
              v-if="tag !== $route.params.tag"
              :to="`/tags/${tag}`" 
              class="hover:underline"
            >
              {{ tag }}
            </NuxtLink>
            <span v-else>{{ tag }}</span>
          </span>
        </div>
      </article>
    </div>

    <div v-else class="bg-white rounded-lg border border-slate-200 p-8 text-center">
      <div class="text-slate-500">
        <svg class="mx-auto h-12 w-12 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="text-lg font-medium text-slate-900 mb-2">No articles found</h3>
        <p class="text-slate-600 mb-4">
          No articles are tagged with "{{ $route.params.tag }}"
        </p>
        <NuxtLink 
          to="/tags"
          class="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Browse All Tags
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const tag = route.params.tag

const allArticles = await queryContent('articles').find()

const filteredArticles = computed(() => {
  if (!allArticles) return []
  
  return allArticles
    .filter(article => article.tags && article.tags.includes(tag))
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
})

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

useSeoMeta({
  title: `${tag} Articles - My Newsletter`,
  ogTitle: `${tag} Articles - My Newsletter`,
  description: `Browse all articles tagged with ${tag}. Find insights and content related to ${tag}.`,
  ogDescription: `Browse all articles tagged with ${tag}. Find insights and content related to ${tag}.`
})
</script>