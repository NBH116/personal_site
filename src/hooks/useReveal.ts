import { useEffect, useRef, useState } from 'react'

import { usePrefersReducedMotion } from './usePrefersReducedMotion'

/**
 * 滚动入场。
 *
 * 隐藏态写在 CSS 的 `prefers-reduced-motion: no-preference` 分支里，
 * 所以即使用户禁用动效或 JS 失效，内容也不会停留在不可见状态。
 */
export function useReveal<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null)
  const [visible, setVisible] = useState(false)
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) {
      setVisible(true)
      return
    }

    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [prefersReducedMotion, threshold])

  return { ref, visible }
}
