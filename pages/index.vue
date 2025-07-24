<template>
  <div class="max-w-4xl mx-auto px-4">
    <!-- Hero Section -->
    <div class="text-center mb-12">
      <h1 class="text-4xl font-bold text-slate-900 mb-4">
        Welcome to Your Newsletter
      </h1>
      <p class="text-lg text-slate-600 max-w-2xl mx-auto">
        Discover the latest insights on web development, design, and technology. 
        Subscribe to stay updated with our latest articles.
      </p>
    </div>

    <!-- Newsletter Signup -->
    <div id="subscribe" class="bg-white rounded-lg border border-slate-200 p-8 mb-12">
      <div class="max-w-md mx-auto">
        <h2 class="text-2xl font-semibold text-slate-900 mb-4 text-center">
          Subscribe to Our Newsletter
        </h2>
        <form @submit.prevent="handleSubscribe" class="space-y-4">
          <div>
            <label for="email" class="sr-only">Email address</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email address"
            />
          </div>
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ loading ? 'Subscribing...' : 'Subscribe' }}
          </button>
        </form>
        <div v-if="message" :class="messageClass" class="mt-4 p-3 rounded-md text-sm">
          {{ message }}
        </div>
      </div>
    </div>

    <!-- Articles Section -->
    <div>
      <h2 class="text-3xl font-bold text-slate-900 mb-8">Latest Articles</h2>
      
      <div v-if="articles && articles.length > 0" class="space-y-6">
        <article 
          v-for="article in articles" 
          :key="article._path"
          class="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition-shadow"
        >
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3">
            <h3 class="text-xl font-semibold text-slate-900 mb-2">
              <NuxtLink 
                :to="article._path"
                class="hover:text-blue-600 transition-colors"
              >
                {{ article.title }}
              </NuxtLink>
            </h3>
            <time class="text-sm text-slate-500">
              {{ formatDate(article.publishedAt) }}
            </time>
          </div>
          
          <p class="text-slate-600 mb-4">
            {{ article.description }}
          </p>
          
          <div v-if="article.tags && article.tags.length > 0" class="flex flex-wrap gap-2">
            <NuxtLink
              v-for="tag in article.tags"
              :key="tag"
              :to="`/tags/${tag}`"
              class="text-xs font-medium px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors"
            >
              {{ tag }}
            </NuxtLink>
          </div>
        </article>
      </div>

      <div v-else class="text-center py-12">
        <p class="text-slate-600">No articles found.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
// Get all articles (both static and published database posts)
const data = await $fetch('/api/articles')
const articles = data?.articles || []


const email = ref('')
const loading = ref(false)
const message = ref('')
const messageClass = ref('')

const handleSubscribe = async () => {
  loading.value = true
  message.value = ''
  
  try {
    await $fetch('/api/subscribe', {
      method: 'POST',
      body: { email: email.value }
    })
    
    message.value = 'Successfully subscribed! Check your email for confirmation.'
    messageClass.value = 'bg-green-100 text-green-800'
    email.value = ''
  } catch (error) {
    message.value = error.data?.message || 'An error occurred. Please try again.'
    messageClass.value = 'bg-red-100 text-red-800'
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

useSeoMeta({
  title: 'Your Newsletter - Web Development Insights',
  ogTitle: 'Your Newsletter - Web Development Insights',
  description: 'Discover the latest insights on web development, design, and technology. Subscribe to stay updated with our latest articles.',
  ogDescription: 'Discover the latest insights on web development, design, and technology. Subscribe to stay updated with our latest articles.'
})
</script>