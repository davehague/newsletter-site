<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center space-x-4">
            <NuxtLink to="/admin/posts" class="text-sm text-gray-600 hover:text-gray-900">← Back to Posts</NuxtLink>
            <h1 class="text-xl font-semibold text-gray-900">
              Edit Post{{ post ? `: ${post.title}` : '' }}
            </h1>
          </div>
          <div class="flex items-center space-x-4">
            <button v-if="!loading && post" @click="savePost" :disabled="saving"
              class="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md text-sm font-medium">
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
            <span class="text-sm text-gray-700">Welcome, {{ user?.username }}</span>
            <button @click="handleLogout"
              class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>

    <main class="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span class="ml-2 text-gray-600">Loading post...</span>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-md p-4">
          <div class="flex">
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">Error loading post</h3>
              <div class="mt-2 text-sm text-red-700">
                {{ error }}
              </div>
              <div class="mt-4">
                <button @click="loadPost" class="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded-md text-sm">
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Edit Form -->
        <div v-else-if="post" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Metadata Form -->
          <div class="lg:col-span-1">
            <AdminMetadataForm v-model="postData" :status="post.status" :source="post.source" />
          </div>

          <!-- Content Editor -->
          <div class="lg:col-span-2">
            <AdminPostEditor v-model="postContent" initial-mode="wysiwyg" />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth'
})

const { user, clear } = useUserSession()

// Toast notifications
const { showSuccess, showError } = useToast()
const route = useRoute()
const slug = route.params.slug

// State
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const post = ref(null)

// Form data
const postData = ref({
  title: '',
  description: '',
  publishedAt: '',
  tags: [],
  sendAsNewsletter: false
})

const postContent = ref('')

// Load post data
const loadPost = async () => {
  try {
    loading.value = true
    error.value = ''

    const response = await $fetch(`/api/admin/posts/${slug}`)
    post.value = response.post

    // Populate form
    postData.value = {
      title: post.value.title,
      description: post.value.description,
      publishedAt: post.value.publishedAt,
      tags: [...post.value.tags],
      sendAsNewsletter: post.value.sendAsNewsletter
    }

    postContent.value = post.value.content || ''
  } catch (err) {
    error.value = err.message || 'Failed to load post'
  } finally {
    loading.value = false
  }
}

const handleLogout = async () => {
  try {
    await $fetch('/api/auth/logout', {
      method: 'POST'
    })
    await clear()
    await navigateTo('/admin/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

const savePost = async () => {
  // Validate required fields
  if (!postData.value.title.trim()) {
    showError('Validation Error', 'Please enter a title')
    return
  }

  if (!postData.value.description.trim()) {
    showError('Validation Error', 'Please enter a description')
    return
  }

  if (!postContent.value.trim()) {
    showError('Validation Error', 'Please enter some content')
    return
  }

  try {
    saving.value = true

    const response = await $fetch(`/api/admin/posts/${slug}`, {
      method: 'PUT',
      body: {
        ...postData.value,
        content: postContent.value
      }
    })

    showSuccess('Post Updated!', 'Post updated successfully')
    await navigateTo('/admin/posts')
  } catch (error) {
    showError('Update Failed', error.message || 'Failed to update post')
  } finally {
    saving.value = false
  }
}

// Load post on mount
onMounted(() => {
  loadPost()
})
</script>