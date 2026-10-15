import type { ReactNode } from 'react'

import { cx } from '@/lib/cx'

interface TagProps {
  children: ReactNode
  /** 选中态用于筛选项，普通标签保持静态样式 */
  tone?: 'default' | 'accent'
  className?: string
}

export function Tag({ children, tone = 'default', className }: TagProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs transition-colors duration-200 ease-standard',
        tone === 'accent' ? 'bg-accent-soft text-accent' : 'border border-border text-fg-muted',
        className,
      )}
    >
      {children}
    </span>
  )
}
