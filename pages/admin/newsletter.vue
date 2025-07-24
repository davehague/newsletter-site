<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center space-x-4">
            <NuxtLink to="/admin" class="text-sm text-gray-600 hover:text-gray-900">← Back to Dashboard</NuxtLink>
            <h1 class="text-xl font-semibold text-gray-900">Newsletter Management</h1>
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
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Newsletter Queue</h2>
          <p class="text-gray-600">This page will show articles queued for newsletter sending and allow manual trigger.</p>
          <p class="text-gray-600 mt-2">Coming soon...</p>
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