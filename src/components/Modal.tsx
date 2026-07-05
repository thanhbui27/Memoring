import type { ReactNode } from 'react'
import { X } from 'lucide-react'

type ModalProps = {
  title: string
  children: ReactNode
  onClose: () => void
}

export function Modal({ title, children, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-3 sm:items-center" role="dialog" aria-modal="true">
      <div className="w-full max-w-md border shadow-paper" style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderRadius: 8 }}>
        <div className="flex items-center justify-between gap-3 border-b p-4" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-lg font-black">{title}</h2>
          <button className="btn-ghost h-10 w-10 p-0" type="button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
