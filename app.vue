<template>
  <div class="min-h-screen bg-slate-50">
    <header class="bg-white border-b border-slate-200">
      <nav class="max-w-4xl mx-auto px-4 py-6">
        <div class="flex justify-between items-center">
          <NuxtLink to="/" class="text-xl font-bold text-slate-900 hover:text-blue-600">
            Your Newsletter
          </NuxtLink>
          <div class="flex space-x-6">
            <NuxtLink to="/" class="text-slate-700 hover:text-blue-600">Articles</NuxtLink>
            <NuxtLink to="/tags" class="text-slate-700 hover:text-blue-600">Tags</NuxtLink>
          </div>
        </div>
      </nav>
    </header>

    <main class="py-12">
      <NuxtPage />
    </main>

    <footer class="bg-white border-t border-slate-200 mt-16">
      <div class="max-w-4xl mx-auto px-4 py-8 text-center text-slate-600">
        <p>&copy; 2025 Your Newsletter. All rights reserved.</p>
      </div>
    </footer>

    <!-- Global Toast Notifications -->
    <Toast
      :visible="toastState.visible"
      :type="toastState.type"
      :title="toastState.title"
      :message="toastState.message"
      :duration="toastState.duration"
      @close="hideToast"
    />
  </div>
</template>

<script setup>
const { toastState, hideToast } = useToast()
</script>