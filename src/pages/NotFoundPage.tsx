import { Link } from 'react-router-dom'

import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export function NotFoundPage() {
  useDocumentTitle('页面不存在')

  return (
    <div className="mx-auto flex w-full max-w-content flex-col items-start px-gutter py-section sm:px-8 md:py-24">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="mt-4 text-3xl font-semibold text-fg sm:text-4xl">这个页面不存在</h1>
      <p className="mt-4 max-w-xl text-fg-muted">
        链接可能已经失效，或者地址拼写有误。可以从下面的入口继续浏览。
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center rounded-control bg-accent px-5 text-sm font-medium text-bg transition-colors duration-200 ease-standard hover:bg-accent-strong"
        >
          回到首页
        </Link>
        <Link
          to="/projects"
          className="inline-flex min-h-11 items-center rounded-control border border-border bg-surface px-5 text-sm text-fg transition-colors duration-200 ease-standard hover:bg-surface-hover"
        >
          查看项目
        </Link>
        <Link
          to="/blog"
          className="inline-flex min-h-11 items-center rounded-control border border-border bg-surface px-5 text-sm text-fg transition-colors duration-200 ease-standard hover:bg-surface-hover"
        >
          查看博客
        </Link>
      </div>
    </div>
  )
}
