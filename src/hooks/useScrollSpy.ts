import { useEffect, useState } from 'react'

/**
 * 高亮当前所在区块。
 *
 * `ids` 必须是稳定引用（模块级常量或 useMemo 结果），否则每次渲染都会重建监听。
 * 用滚动 + 单次 rAF 节流而不是监听每次 scroll 计算，避免长列表下的布局抖动。
 */
export function useScrollSpy(ids: readonly string[], offset = 96): string | null {
  const [active, setActive] = useState<string | null>(ids[0] ?? null)

  useEffect(() => {
    if (ids.length === 0) return

    let frame = 0

    const update = () => {
      frame = 0
      let current: string | null = ids[0] ?? null

      for (const id of ids) {
        const element = document.getElementById(id)
        if (!element) continue
        if (element.getBoundingClientRect().top - offset <= 0) {
          current = id
        } else {
          break
        }
      }

      setActive(current)
    }

    const onScroll = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [ids, offset])

  return active
}
