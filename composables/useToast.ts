interface ToastState {
  visible: boolean
  type: 'success' | 'error' | 'info'
  title: string
  message?: string
  duration?: number
}

const toastState = reactive<ToastState>({
  visible: false,
  type: 'info',
  title: '',
  message: '',
  duration: 5000
})

export const useToast = () => {
  const showToast = (options: {
    type?: 'success' | 'error' | 'info'
    title: string
    message?: string
    duration?: number
  }) => {
    toastState.visible = false
    
    // Use nextTick to ensure the toast is properly reset before showing
    nextTick(() => {
      toastState.type = options.type || 'info'
      toastState.title = options.title
      toastState.message = options.message || ''
      toastState.duration = options.duration ?? 5000
      toastState.visible = true
    })
  }

  const hideToast = () => {
    toastState.visible = false
  }

  const showSuccess = (title: string, message?: string) => {
    showToast({ type: 'success', title, message })
  }

  const showError = (title: string, message?: string) => {
    showToast({ type: 'error', title, message })
  }

  const showInfo = (title: string, message?: string) => {
    showToast({ type: 'info', title, message })
  }

  return {
    toastState: readonly(toastState),
    showToast,
    hideToast,
    showSuccess,
    showError,
    showInfo
  }
}