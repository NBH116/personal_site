interface SkipLinkProps {
  /** 目标区块的 id。前台是 `main`，后台是 `admin-main` */
  target?: string
  label?: string
}

/**
 * 键盘用户的第一个可达元素：直接跳到主内容，跳过整条导航（PRD 3.8）。
 * 平时用 sr-only 隐藏，聚焦时才现身。
 */
export function SkipLink({ target = 'main', label = '跳到主要内容' }: SkipLinkProps) {
  return (
    <a
      href={`#${target}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-control focus:border focus:border-border focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:text-fg"
    >
      {label}
    </a>
  )
}
