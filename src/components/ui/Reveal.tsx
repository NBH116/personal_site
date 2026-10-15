import type { ReactNode } from 'react'

import { useReveal } from '@/hooks/useReveal'
import { cx } from '@/lib/cx'

interface RevealProps {
  children: ReactNode
  className?: string
  /** 同一屏内错开入场，制造层次感 */
  delayMs?: number
}

export function Reveal({ children, className, delayMs = 0 }: RevealProps) {
  const { ref, visible } = useReveal<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className={cx('reveal', visible && 'is-visible', className)}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  )
}
