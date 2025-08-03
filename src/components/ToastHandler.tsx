import { useEffect } from 'react'
import { toast } from 'react-toastify'

export function ToastHandler() {
  useEffect(() => {
    const handleCodeCopyFail = (event: CustomEvent) => {
      const { message } = event.detail
      toast.error(message)
    }

    // 监听代码复制成功事件
    window.addEventListener('code-copy-fail', handleCodeCopyFail as EventListener)

    return () => {
      window.removeEventListener('code-copy-fail', handleCodeCopyFail as EventListener)
    }
  }, [])

  // 这个组件不渲染任何内容，只是用来监听事件
  return null
}