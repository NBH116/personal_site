import type { ReactNode } from 'react'

import { cx } from '@/lib/cx'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cx(
        'rounded-card border border-dashed border-border px-6 py-14 text-center',
        className,
      )}
    >
      <p className="text-fg">{title}</p>
      {description ? <p className="mt-2 text-sm text-fg-muted">{description}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  )
}
