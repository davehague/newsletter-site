<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center space-x-4">
            <NuxtLink to="/admin" class="text-sm text-gray-600 hover:text-gray-900">← Back to Dashboard</NuxtLink>
            <h1 class="text-xl font-semibold text-gray-900">Manage Posts</h1>
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
        <AdminPostsList ref="postsListRef" />
      </div>
    </main>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth'
})

const { user, clear } = useUserSession()
const postsListRef = ref()

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

// Build functionality removed - posts are now either static (read-only) or database (editable)
</script>