import { CheckCircle2, Info, XCircle } from 'lucide-react'
import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'

export function Toast() {
  const toast = useAppStore((state) => state.toast)
  const clearToast = useAppStore((state) => state.clearToast)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(clearToast, 2600)
    return () => window.clearTimeout(timer)
  }, [clearToast, toast])

  if (!toast) return null

  const Icon = toast.kind === 'error' ? XCircle : toast.kind === 'info' ? Info : CheckCircle2

  return (
    <div className="toast flex items-center gap-3">
      <Icon size={20} color={toast.kind === 'error' ? 'var(--bad)' : toast.kind === 'info' ? 'var(--blue)' : 'var(--good)'} />
      <p className="text-sm font-bold">{toast.message}</p>
    </div>
  )
}
