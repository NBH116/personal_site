import type { ReactNode } from 'react'

import { cx } from '@/lib/cx'

interface CardProps {
  children: ReactNode
  className?: string
  as?: 'div' | 'article' | 'li'
}

export function Card({ children, className, as: Tag = 'div' }: CardProps) {
  return (
    <Tag
      className={cx(
        'rounded-card border border-border bg-surface p-6 transition-colors duration-200 ease-standard',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
