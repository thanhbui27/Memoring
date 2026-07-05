import type { ReactNode } from 'react'

type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="panel mx-auto max-w-md text-center">
      <div className="mx-auto mb-3 h-3 w-20 rounded-full" style={{ background: 'var(--accent-soft)' }} />
      <h2 className="text-xl font-black">{title}</h2>
      {description ? <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
