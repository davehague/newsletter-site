<template>
  <div class="post-editor bg-white rounded-lg shadow-sm border">
    <!-- Editor Mode Toggle -->
    <div class="border-b px-6 py-4 flex items-center justify-between">
      <h3 class="text-lg font-medium">Content Editor</h3>
      <div class="flex items-center space-x-2">
        <button
          @click="setMode('wysiwyg')"
          :class="[
            'px-3 py-1 text-sm rounded',
            mode === 'wysiwyg' 
              ? 'bg-blue-100 text-blue-700 font-medium' 
              : 'text-gray-600 hover:text-gray-800'
          ]"
        >
          WYSIWYG
        </button>
        <button
          @click="setMode('markdown')"
          :class="[
            'px-3 py-1 text-sm rounded',
            mode === 'markdown' 
              ? 'bg-blue-100 text-blue-700 font-medium' 
              : 'text-gray-600 hover:text-gray-800'
          ]"
        >
          Markdown
        </button>
        <button
          @click="showPreview = !showPreview"
          :class="[
            'px-3 py-1 text-sm rounded',
            showPreview 
              ? 'bg-green-100 text-green-700 font-medium' 
              : 'text-gray-600 hover:text-gray-800'
          ]"
        >
          Preview
        </button>
      </div>
    </div>

    <div class="flex">
      <!-- Editor Panel -->
      <div :class="showPreview ? 'w-1/2 border-r' : 'w-full'">
        <!-- WYSIWYG Editor -->
        <div v-if="mode === 'wysiwyg'" class="min-h-96">
          <div class="border-b px-4 py-2 bg-gray-50 flex flex-wrap gap-2">
            <!-- Toolbar buttons -->
            <button
              @click="editor?.chain().focus().toggleBold().run()"
              :class="editor?.isActive('bold') ? 'bg-blue-100' : ''"
              class="p-2 rounded hover:bg-gray-200 text-sm font-bold"
            >
              B
            </button>
            <button
              @click="editor?.chain().focus().toggleItalic().run()"
              :class="editor?.isActive('italic') ? 'bg-blue-100' : ''"
              class="p-2 rounded hover:bg-gray-200 text-sm italic"
            >
              I
            </button>
            <button
              @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
              :class="editor?.isActive('heading', { level: 2 }) ? 'bg-blue-100' : ''"
              class="p-2 rounded hover:bg-gray-200 text-sm font-semibold"
            >
              H2
            </button>
            <button
              @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()"
              :class="editor?.isActive('heading', { level: 3 }) ? 'bg-blue-100' : ''"
              class="p-2 rounded hover:bg-gray-200 text-sm font-semibold"
            >
              H3
            </button>
            <button
              @click="editor?.chain().focus().toggleBulletList().run()"
              :class="editor?.isActive('bulletList') ? 'bg-blue-100' : ''"
              class="p-2 rounded hover:bg-gray-200 text-sm"
            >
              •
            </button>
            <button
              @click="editor?.chain().focus().toggleOrderedList().run()"
              :class="editor?.isActive('orderedList') ? 'bg-blue-100' : ''"
              class="p-2 rounded hover:bg-gray-200 text-sm"
            >
              1.
            </button>
            <button
              @click="editor?.chain().focus().toggleCodeBlock().run()"
              :class="editor?.isActive('codeBlock') ? 'bg-blue-100' : ''"
              class="p-2 rounded hover:bg-gray-200 text-sm font-mono"
            >
              &lt;/&gt;
            </button>
          </div>
          <div ref="editorElement" class="prose max-w-none p-6 min-h-80 focus:outline-none"></div>
        </div>

        <!-- Markdown Editor -->
        <div v-else class="min-h-96">
          <textarea
            v-model="markdownContent"
            @input="onMarkdownChange"
            class="w-full h-96 p-6 font-mono text-sm border-none resize-none focus:outline-none"
            placeholder="Write your post content in Markdown..."
          />
        </div>
      </div>

      <!-- Preview Panel -->
      <div v-if="showPreview" class="w-1/2 bg-gray-50">
        <div class="px-4 py-2 bg-gray-100 border-b">
          <span class="text-sm font-medium text-gray-700">Preview</span>
        </div>
        <div class="p-6">
          <div class="prose max-w-none" v-html="previewHtml"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { marked } from 'marked'

const props = defineProps<{
  modelValue: string
  initialMode?: 'wysiwyg' | 'markdown'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// Toast notifications
const { showError } = useToast()

// State
const mode = ref<'wysiwyg' | 'markdown'>(props.initialMode || 'wysiwyg')
const showPreview = ref(false)
const editor = ref<Editor | null>(null)
const editorElement = ref<HTMLElement>()
const markdownContent = ref(props.modelValue || '')
const previewHtml = ref('')

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  if (newValue !== markdownContent.value && !isSwitchingMode.value) {
    markdownContent.value = newValue
    updatePreview()
    
    if (editor.value && mode.value === 'wysiwyg') {
      try {
        const html = marked(newValue)
        // Use nextTick to avoid transaction conflicts
        nextTick(() => {
          if (editor.value && !isSwitchingMode.value) {
            editor.value.commands.setContent(html, false, { preserveWhitespace: 'full' })
          }
        })
      } catch (error) {
        console.error('Error updating WYSIWYG content:', error)
      }
    }
  }
})

// Initialize editor
onMounted(() => {
  if (editorElement.value) {
    editor.value = new Editor({
      element: editorElement.value,
      extensions: [StarterKit],
      content: marked(markdownContent.value),
      onUpdate: ({ editor }) => {
        if (mode.value === 'wysiwyg' && !isSwitchingMode.value) {
          try {
            // Convert HTML back to markdown
            const html = editor.getHTML()
            const markdown = htmlToMarkdown(html)
            
            // Only update if content actually changed to prevent loops
            if (markdown !== markdownContent.value) {
              markdownContent.value = markdown
              emit('update:modelValue', markdown)
              updatePreview()
            }
          } catch (error) {
            console.error('Error in WYSIWYG onUpdate:', error)
          }
        }
      },
      editorProps: {
        attributes: {
          class: 'prose max-w-none focus:outline-none',
        },
      },
    })
  }
  
  updatePreview()
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

// Flag to prevent updates during mode switching
const isSwitchingMode = ref(false)

// Methods
async function setMode(newMode: 'wysiwyg' | 'markdown') {
  if (newMode === mode.value || isSwitchingMode.value) return
  
  const oldMode = mode.value
  isSwitchingMode.value = true
  
  try {
    if (newMode === 'wysiwyg' && editor.value) {
      // First update the mode to hide the markdown editor
      mode.value = newMode
      
      // Wait for DOM update
      await nextTick()
      
      // Convert markdown to HTML for WYSIWYG
      const html = marked(markdownContent.value)
      
      // Destroy and recreate the editor to avoid state conflicts
      editor.value.destroy()
      
      // Wait a bit to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Recreate editor with new content
      if (editorElement.value) {
        editor.value = new Editor({
          element: editorElement.value,
          extensions: [StarterKit],
          content: html,
          onUpdate: ({ editor }) => {
            if (mode.value === 'wysiwyg' && !isSwitchingMode.value) {
              try {
                const html = editor.getHTML()
                const markdown = htmlToMarkdown(html)
                
                if (markdown !== markdownContent.value) {
                  markdownContent.value = markdown
                  emit('update:modelValue', markdown)
                  updatePreview()
                }
              } catch (error) {
                console.error('Error in WYSIWYG onUpdate:', error)
              }
            }
          },
          editorProps: {
            attributes: {
              class: 'prose max-w-none focus:outline-none',
            },
          },
        })
      }
      
    } else if (newMode === 'markdown' && editor.value) {
      // Convert HTML to markdown before switching
      const html = editor.value.getHTML()
      const markdown = htmlToMarkdown(html)
      markdownContent.value = markdown
      emit('update:modelValue', markdown)
      
      // Update mode to show markdown editor
      mode.value = newMode
    }
  } catch (error) {
    console.error('Error switching editor modes:', error)
    // Revert mode on error
    mode.value = oldMode
    
    // Show user-friendly error
    showError('Editor Error', 'Error switching editor modes. Please try again or refresh the page.')
  } finally {
    isSwitchingMode.value = false
  }
}

function onMarkdownChange() {
  emit('update:modelValue', markdownContent.value)
  updatePreview()
}

function updatePreview() {
  previewHtml.value = marked(markdownContent.value)
}

// Simple HTML to Markdown conversion
function htmlToMarkdown(html: string): string {
  // This is a basic implementation - you might want to use a proper library
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<del[^>]*>(.*?)<\/del>/gi, '~~$1~~')
    .replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~')
    .replace(/<strike[^>]*>(.*?)<\/strike>/gi, '~~$1~~')
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    .replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```\n\n')
    .replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n') + '\n'
    })
    .replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
      let counter = 1
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${counter++}. $1\n`) + '\n'
    })
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br[^>]*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '') // Remove remaining HTML tags
    .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines
    .trim()
}
</script>

<style scoped>
.post-editor {
  @apply border border-gray-200;
}

/* Tiptap editor styles */
:deep(.ProseMirror) {
  outline: none;
  padding: 1.5rem;
  min-height: 20rem;
}

:deep(.ProseMirror p.is-editor-empty:first-child::before) {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
</style>