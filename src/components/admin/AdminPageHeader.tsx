import type { ReactNode } from 'react'

interface AdminPageHeaderProps {
  title: string
  description?: string
  /** 右侧操作区，通常是「新建」按钮 */
  actions?: ReactNode
  children?: ReactNode
}

/** 后台每个页面顶部的标题区，保证标题层级与间距一致 */
export function AdminPageHeader({ title, description, actions, children }: AdminPageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-border pb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">{title}</h1>
          {description ? <p className="mt-2 max-w-2xl text-sm text-fg-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </header>
  )
}
