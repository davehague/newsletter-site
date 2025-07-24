<template>
  <div class="metadata-form bg-white rounded-lg shadow-sm border p-6">
    <h3 class="text-lg font-medium mb-6">Post Metadata</h3>
    
    <div class="space-y-6">
      <!-- Title -->
      <div>
        <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
          Title *
        </label>
        <input
          id="title"
          v-model="formData.title"
          type="text"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter post title"
        />
        <p v-if="slugPreview" class="mt-1 text-xs text-gray-500">
          URL: /articles/{{ slugPreview }}
        </p>
      </div>

      <!-- Description -->
      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          id="description"
          v-model="formData.description"
          rows="3"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="SEO description (150-160 characters recommended)"
        />
        <p class="mt-1 text-xs text-gray-500">
          {{ formData.description.length }} characters
          <span v-if="formData.description.length > 160" class="text-orange-600">
            (over recommended limit)
          </span>
        </p>
      </div>

      <!-- Published Date -->
      <div>
        <label for="publishedAt" class="block text-sm font-medium text-gray-700 mb-2">
          Published Date *
        </label>
        <input
          id="publishedAt"
          v-model="formData.publishedAt"
          type="date"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <!-- Tags -->
      <div>
        <label for="tags" class="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <div class="flex flex-wrap gap-2 mb-2">
          <span
            v-for="(tag, index) in formData.tags"
            :key="index"
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
          >
            {{ tag }}
            <button
              @click="removeTag(index)"
              class="ml-1 text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </span>
        </div>
        <div class="flex">
          <input
            v-model="newTag"
            @keydown.enter.prevent="addTag"
            @keydown.comma.prevent="addTag"
            type="text"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add a tag"
          />
          <button
            @click="addTag"
            type="button"
            class="px-4 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            Add
          </button>
        </div>
        <p class="mt-1 text-xs text-gray-500">
          Press Enter or comma to add tags
        </p>
      </div>

      <!-- Newsletter Settings -->
      <div class="border-t pt-6">
        <h4 class="text-sm font-medium text-gray-900 mb-4">Newsletter Settings</h4>
        
        <div class="flex items-center">
          <input
            id="sendAsNewsletter"
            v-model="formData.sendAsNewsletter"
            type="checkbox"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label for="sendAsNewsletter" class="ml-2 block text-sm text-gray-900">
            Send as newsletter
          </label>
        </div>
        <p class="mt-1 text-xs text-gray-500">
          When enabled, this post will be included in the next newsletter campaign
        </p>
      </div>

      <!-- Status Display -->
      <div v-if="status" class="border-t pt-6">
        <h4 class="text-sm font-medium text-gray-900 mb-2">Status</h4>
        <div class="flex items-center">
          <span
            :class="[
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
              status === 'published' 
                ? 'bg-green-100 text-green-800'
                : status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            ]"
          >
            {{ status === 'published' ? 'Published' : status === 'pending' ? 'Pending Build' : 'Draft' }}
          </span>
          <span v-if="source" class="ml-2 text-xs text-gray-500">
            ({{ source === 'temp' ? 'In Database' : 'Static File' }})
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface FormData {
  title: string
  description: string
  publishedAt: string
  tags: string[]
  sendAsNewsletter: boolean
}

const props = defineProps<{
  modelValue: FormData
  status?: 'draft' | 'pending' | 'published'
  source?: 'temp' | 'static'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: FormData]
}>()

// Local form data
const formData = ref<FormData>({ ...props.modelValue })
const newTag = ref('')

// Computed slug preview
const slugPreview = computed(() => {
  if (!formData.value.title) return ''
  return formData.value.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
})

// Flag to prevent circular updates
const isUpdatingInternal = ref(false)

// Watch for changes and emit updates
watch(formData, (newData) => {
  if (!isUpdatingInternal.value) {
    emit('update:modelValue', { ...newData })
  }
}, { deep: true })

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  // Only update if the values are actually different
  if (JSON.stringify(newValue) !== JSON.stringify(formData.value)) {
    isUpdatingInternal.value = true
    formData.value = { ...newValue }
    nextTick(() => {
      isUpdatingInternal.value = false
    })
  }
}, { deep: true })

// Tag management
function addTag() {
  const tag = newTag.value.trim()
  if (tag && !formData.value.tags.includes(tag)) {
    formData.value.tags.push(tag)
    newTag.value = ''
  }
}

function removeTag(index: number) {
  formData.value.tags.splice(index, 1)
}

// Initialize with today's date if not set
onMounted(() => {
  if (!formData.value.publishedAt) {
    formData.value.publishedAt = new Date().toISOString().split('T')[0]
  }
})
</script>

<style scoped>
.metadata-form {
  @apply border border-gray-200;
}
</style>