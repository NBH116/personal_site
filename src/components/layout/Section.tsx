import type { ReactNode } from 'react'

import { cx } from '@/lib/cx'

interface SectionProps {
  id: string
  title?: string
  description?: string
  children: ReactNode
  className?: string
}

/**
 * 统一的区块容器：负责锚点 id、吸顶导航的滚动偏移与区块留白。
 * scroll-mt 必须与导航高度对应，否则锚点跳转后标题会被吸顶导航遮挡（PRD 3.8）。
 */
export function Section({ id, title, description, children, className }: SectionProps) {
  const headingId = `${id}-heading`

  return (
    <section
      id={id}
      aria-labelledby={title ? headingId : undefined}
      className={cx('scroll-mt-16 py-section md:scroll-mt-20 md:py-24', className)}
    >
      <div className="mx-auto w-full max-w-content px-gutter sm:px-8">
        {title ? (
          <header className="mb-10 md:mb-14">
            <h2 id={headingId} className="text-2xl font-semibold text-fg sm:text-3xl">
              {title}
            </h2>
            {description ? <p className="mt-3 max-w-2xl text-fg-muted">{description}</p> : null}
          </header>
        ) : null}
        {children}
      </div>
    </section>
  )
}
