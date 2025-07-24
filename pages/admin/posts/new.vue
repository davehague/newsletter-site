<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center space-x-4">
            <NuxtLink to="/admin/posts" class="text-sm text-gray-600 hover:text-gray-900">← Back to Posts</NuxtLink>
            <h1 class="text-xl font-semibold text-gray-900">Create New Post</h1>
          </div>
          <div class="flex items-center space-x-4">
            <button
              @click="savePost"
              :disabled="saving"
              class="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              {{ saving ? 'Saving...' : 'Save Post' }}
            </button>
            <span class="text-sm text-gray-700">Welcome, {{ user?.username }}</span>
            <button
              @click="handleLogout"
              class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>

    <main class="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Metadata Form -->
          <div class="lg:col-span-1">
            <AdminMetadataForm
              v-model="postData"
              :status="'draft'"
            />
          </div>

          <!-- Content Editor -->
          <div class="lg:col-span-2">
            <AdminPostEditor
              v-model="postContent"
              initial-mode="wysiwyg"
            />
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
const saving = ref(false)

// Toast notifications
const { showSuccess, showError } = useToast()

// Form data
const postData = ref({
  title: '',
  description: '',
  publishedAt: new Date().toISOString().split('T')[0],
  tags: [],
  sendAsNewsletter: false
})

const postContent = ref('')

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
    
    const response = await $fetch('/api/admin/posts', {
      method: 'POST',
      body: {
        ...postData.value,
        content: postContent.value
      }
    })
    
    showSuccess('Post Created!', 'Post created successfully as draft')
    await navigateTo('/admin/posts')
  } catch (error) {
    showError('Create Failed', error.message || 'Failed to create post')
  } finally {
    saving.value = false
  }
}
</script>