import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  children?: ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <header className="border-b border-border pt-10 pb-8 md:pt-14 md:pb-10">
      <div className="mx-auto w-full max-w-content px-gutter sm:px-8">
        <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl text-fg-muted">{description}</p> : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </header>
  )
}
