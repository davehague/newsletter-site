<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
          </div>
          <div class="flex items-center space-x-4">
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
        <div class="border-4 border-dashed border-gray-200 rounded-lg p-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Content Management</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-2">Create New Post</h3>
                <p class="text-sm text-gray-600 mb-4">Write and publish a new article</p>
                <button 
                  @click="navigateTo('/admin/posts/new')"
                  class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  New Post
                </button>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-2">Manage Posts</h3>
                <p class="text-sm text-gray-600 mb-4">Edit existing articles and content</p>
                <button 
                  @click="navigateTo('/admin/posts')"
                  class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Manage Posts
                </button>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-2">Send Newsletter</h3>
                <p class="text-sm text-gray-600 mb-4">Queue articles for newsletter delivery</p>
                <button 
                  @click="navigateTo('/admin/newsletter')"
                  class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Newsletter
                </button>
              </div>
            </div>
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
</script>