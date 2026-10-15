import { useEffect, useState, type MouseEvent } from 'react'

import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { cx } from '@/lib/cx'
import type { TocItem } from '@/schemas/content'

interface TocProps {
  items: TocItem[]
}

/** 判定「已越过标题」的参考线位置，与吸顶导航高度对应 */
const ACTIVE_LINE_OFFSET = 140

/**
 * 目录高亮用滚动位置计算而不是 IntersectionObserver：
 * 需要的语义是「当前处于哪一节」，用参考线取最后一个越过的标题比观察可见性更稳定。
 * 目录数据来自构建期抽取结果，运行时不重新解析正文。
 */
export function Toc({ items }: TocProps) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null)
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (items.length === 0) return

    let frame = 0

    const update = () => {
      frame = 0
      let current: string | null = items[0]?.id ?? null

      for (const item of items) {
        const element = document.getElementById(item.id)
        if (!element) continue
        if (element.getBoundingClientRect().top - ACTIVE_LINE_OFFSET <= 0) {
          current = item.id
        } else {
          break
        }
      }

      setActiveId(current)
    }

    const onScroll = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [items])

  if (items.length === 0) return null

  const handleJump = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    const element = document.getElementById(id)
    if (!element) return

    // 阻止默认行为，避免点目录时污染浏览器历史
    event.preventDefault()
    element.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    })
    setActiveId(id)
  }

  const list = (
    <ul className="flex flex-col gap-1">
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            onClick={(event) => handleJump(event, item.id)}
            aria-current={activeId === item.id ? 'location' : undefined}
            className={cx(
              'block rounded-control py-1.5 pr-2 text-sm transition-colors duration-200 ease-standard',
              item.depth === 3 ? 'pl-7' : 'pl-3',
              activeId === item.id ? 'text-accent' : 'text-fg-muted hover:text-fg',
            )}
          >
            {item.text}
          </a>
        </li>
      ))}
    </ul>
  )

  return (
    <>
      {/* 移动端：折叠面板 */}
      <details className="mb-8 rounded-card border border-border bg-surface px-4 py-3 lg:hidden">
        <summary className="cursor-pointer text-sm text-fg">本文目录</summary>
        <div className="mt-3">{list}</div>
      </details>

      {/* 桌面端：右侧吸附 */}
      <aside
        aria-label="文章目录"
        className="sticky top-24 hidden max-h-[calc(100vh-8rem)] w-56 shrink-0 overflow-y-auto lg:block"
      >
        <p className="mb-3 pl-3 text-xs tracking-wide text-fg-subtle">本文目录</p>
        {list}
      </aside>
    </>
  )
}
