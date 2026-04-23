export type ToastType = 'success' | 'error'

export function emitToast(message: string, type: ToastType = 'success') {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent('app-toast', {
      detail: {
        message,
        type,
      },
    }),
  )
}
