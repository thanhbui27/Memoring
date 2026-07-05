import { AlertTriangle } from 'lucide-react'

type ConfirmDialogProps = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-3 sm:items-center" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm border p-4 shadow-paper animate-[popIn_180ms_ease-out]" style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderRadius: 8 }}>
        <div className="flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: danger ? '#ffe0dc' : 'var(--accent-soft)', color: danger ? 'var(--bad)' : 'var(--accent-strong)' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <h2 className="text-lg font-black">{title}</h2>
            <p className="mt-1 text-sm leading-6" style={{ color: 'var(--muted)' }}>{message}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button className="btn" type="button" onClick={onCancel}>{cancelLabel}</button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} type="button" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
