<template>
  <div class="max-w-4xl mx-auto px-4">
    <div class="text-center mb-12">
      <h1 class="text-3xl font-bold text-slate-900 mb-4">
        Browse by Tags
      </h1>
      <p class="text-lg text-slate-600">
        Explore articles by topic
      </p>
    </div>

    <div class="bg-white rounded-lg border border-slate-200 p-8">
      <div class="flex flex-wrap gap-3">
        <NuxtLink
          v-for="tag in tags"
          :key="tag.name"
          :to="`/tags/${tag.name}`"
          class="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors"
        >
          <span class="font-medium">{{ tag.name }}</span>
          <span class="ml-2 bg-blue-200 text-blue-700 text-xs px-2 py-0.5 rounded-full">
            {{ tag.count }}
          </span>
        </NuxtLink>
      </div>
      
      <div v-if="tags.length === 0" class="text-center text-slate-500">
        No tags found
      </div>
    </div>
  </div>
</template>

<script setup>
const articles = await queryContent('articles').find()

const tags = computed(() => {
  if (!articles) return []
  
  const tagCounts = {}
  
  articles.forEach(article => {
    if (article.tags) {
      article.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    }
  })
  
  return Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

useSeoMeta({
  title: 'Tags - My Newsletter',
  ogTitle: 'Tags - My Newsletter',
  description: 'Browse articles by topic and find content that interests you most',
  ogDescription: 'Browse articles by topic and find content that interests you most'
})
</script>