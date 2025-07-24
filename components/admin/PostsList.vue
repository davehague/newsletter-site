<template>
  <div class="posts-list bg-white rounded-lg shadow-sm border">
    <!-- Header -->
    <div class="px-6 py-4 border-b">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium">Posts</h3>
        <div class="flex items-center space-x-4">
          <!-- Search -->
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search posts..."
            class="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <!-- Filter -->
          <select
            v-model="statusFilter"
            class="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="pending">Pending</option>
            <option value="draft">Draft</option>
          </select>
          <!-- Create Button -->
          <NuxtLink
            to="/admin/posts/new"
            class="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            New Post
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="p-8 text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-2 text-gray-600">Loading posts...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="p-8 text-center text-red-600">
      <p>{{ error }}</p>
      <button
        @click="loadPosts"
        class="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
      >
        Retry
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredPosts.length === 0" class="p-8 text-center text-gray-500">
      <p v-if="searchQuery || statusFilter">No posts match your filters.</p>
      <p v-else>No posts yet. Create your first post!</p>
      <NuxtLink
        v-if="!searchQuery && !statusFilter"
        to="/admin/posts/new"
        class="mt-2 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Create Post
      </NuxtLink>
    </div>

    <!-- Posts Table -->
    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Title
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Published
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Newsletter
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tags
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="post in filteredPosts"
            :key="post.id"
            class="hover:bg-gray-50"
          >
            <!-- Title -->
            <td class="px-6 py-4">
              <div class="flex items-center">
                <div>
                  <div class="text-sm font-medium text-gray-900">
                    {{ post.title }}
                  </div>
                  <div class="text-sm text-gray-500 truncate max-w-md">
                    {{ post.description }}
                  </div>
                </div>
              </div>
            </td>

            <!-- Status -->
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  post.status === 'published' 
                    ? 'bg-green-100 text-green-800'
                    : post.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                ]"
              >
                {{ post.status === 'published' ? 'Published' : post.status === 'pending' ? 'Pending' : 'Draft' }}
              </span>
              <div class="text-xs text-gray-500 mt-1">
                {{ post.source === 'database' ? 'Database' : post.source === 'static' ? 'Static' : post.source }}
              </div>
            </td>

            <!-- Published Date -->
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ formatDate(post.publishedAt) }}
            </td>

            <!-- Newsletter -->
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                v-if="post.sendAsNewsletter"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                Queued
              </span>
              <span
                v-else-if="post.newsletterSentAt"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
              >
                Sent
              </span>
              <span v-else class="text-sm text-gray-500">
                -
              </span>
            </td>

            <!-- Tags -->
            <td class="px-6 py-4">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="tag in post.tags.slice(0, 3)"
                  :key="tag"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {{ tag }}
                </span>
                <span
                  v-if="post.tags.length > 3"
                  class="text-xs text-gray-500"
                >
                  +{{ post.tags.length - 3 }}
                </span>
              </div>
            </td>

            <!-- Actions -->
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex items-center justify-end space-x-2">
                <button
                  v-if="post.source === 'database' && post.status === 'draft'"
                  @click="publishPost(post)"
                  class="text-green-600 hover:text-green-700 font-medium"
                >
                  Publish
                </button>
                <button
                  v-if="post.source === 'database' && post.status === 'published'"
                  @click="unpublishPost(post)"
                  class="text-orange-600 hover:text-orange-700 font-medium"
                >
                  Mark as draft
                </button>
                <NuxtLink
                  v-if="post.isEditable"
                  :to="`/admin/posts/edit/${post.slug}`"
                  class="text-blue-600 hover:text-blue-900"
                >
                  Edit
                </NuxtLink>
                <button
                  v-if="post.isDeletable"
                  @click="deletePost(post)"
                  class="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
                <span 
                  v-if="!post.isEditable && !post.isDeletable"
                  class="text-xs text-gray-400"
                >
                  Read-only
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Post {
  id: string
  slug: string
  title: string
  description: string
  publishedAt: string
  tags: string[]
  sendAsNewsletter: boolean
  newsletterSentAt: string | null
  status: 'draft' | 'pending' | 'published'
  source: 'database' | 'static'
  isPublished: boolean
  isEditable: boolean
  isDeletable: boolean
}

// State
const posts = ref<Post[]>([])
const loading = ref(true)
const error = ref('')
const searchQuery = ref('')
const statusFilter = ref('')

// Toast notifications
const { showSuccess, showError } = useToast()

// Computed
const filteredPosts = computed(() => {
  let filtered = posts.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(post =>
      post.title.toLowerCase().includes(query) ||
      post.description.toLowerCase().includes(query) ||
      post.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter(post => post.status === statusFilter.value)
  }

  return filtered
})

// Methods
async function loadPosts() {
  try {
    loading.value = true
    error.value = ''
    
    const response = await $fetch('/api/admin/posts')
    posts.value = response.posts
  } catch (err: any) {
    error.value = err.message || 'Failed to load posts'
  } finally {
    loading.value = false
  }
}

async function publishPost(post: Post) {
  if (!confirm(`Publish "${post.title}"? This will make it publicly available at /articles/${post.slug}`)) {
    return
  }

  try {
    const result = await $fetch(`/api/admin/posts/${post.slug}/publish`, {
      method: 'POST'
    })
    
    // Refresh the posts list to show the updated state
    await loadPosts()
    
    // Show success message
    showSuccess('Published!', result.message || 'Post published successfully!')
  } catch (err: any) {
    showError('Publish Failed', err.message || 'Failed to publish post')
  }
}

async function unpublishPost(post: Post) {
  if (!confirm(`Mark "${post.title}" as draft? This will remove it from the public site.`)) {
    return
  }

  try {
    const result = await $fetch(`/api/admin/posts/${post.slug}/unpublish`, {
      method: 'POST'
    })
    
    // Refresh the posts list to show the updated state
    await loadPosts()
    
    // Show success message
    showSuccess('Marked as Draft', result.message || 'Post marked as draft successfully!')
  } catch (err: any) {
    showError('Unpublish Failed', err.message || 'Failed to mark post as draft')
  }
}

async function deletePost(post: Post) {
  if (!confirm(`Are you sure you want to delete "${post.title}"?`)) {
    return
  }

  try {
    await $fetch(`/api/admin/posts/${post.slug}`, {
      method: 'DELETE'
    })
    
    // Remove from local list
    posts.value = posts.value.filter(p => p.id !== post.id)
    
    // Show success message
    showSuccess('Deleted!', 'Post deleted successfully')
  } catch (err: any) {
    showError('Delete Failed', err.message || 'Failed to delete post')
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Load posts on mount
onMounted(() => {
  loadPosts()
})

// Expose methods for parent components
defineExpose({
  loadPosts
})
</script>

<style scoped>
.posts-list {
  @apply border border-gray-200;
}
</style>