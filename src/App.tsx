import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Starfield } from '@/components/background/Starfield'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { PageLoading } from '@/components/layout/PageLoading'
import { SkipLink } from '@/components/layout/SkipLink'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { useSettings } from '@/hooks/useSettings'
import { useSiteAppearance } from '@/hooks/useSiteAppearance'

/**
 * 锚点滚动。
 *
 * 导航里的锚点链接由 react-router 接管，跳转走的是 pushState 而不是原生的
 * fragment 导航，浏览器不会自动滚到目标区块；跨路由跳转时目标区块也还没挂载。
 * 所以这里自己处理：按帧重试查找目标，找到后滚过去。
 */
function useHashScroll() {
  const { hash, pathname } = useLocation()
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (!hash) return

    const id = decodeURIComponent(hash.slice(1))
    let frame: number | null = null
    let attempts = 0
    // 跨路由时目标区块要等懒加载页面挂载完成，给约 10 帧的窗口
    const MAX_ATTEMPTS = 10

    const tryScroll = () => {
      const element = document.getElementById(id)

      if (element) {
        element.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'start',
        })
        return
      }

      if (attempts < MAX_ATTEMPTS) {
        attempts += 1
        frame = window.requestAnimationFrame(tryScroll)
      }
    }

    frame = window.requestAnimationFrame(tryScroll)

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame)
    }
  }, [hash, pathname, prefersReducedMotion])
}

/** 全站布局：星空背景 + 跳过导航 + 吸顶导航 + 主内容 + 页脚 */
export function App() {
  const { pathname } = useLocation()
  const { starfieldEnabled } = useSettings()
  useHashScroll()
  useSiteAppearance()

  return (
    <div className="relative flex min-h-dvh flex-col">
      {starfieldEnabled ? <Starfield /> : null}
      <SkipLink />

      {/* 内容整体抬到星空之上（星空是 z-0），但仍在导航之下（导航是 z-40） */}
      <div className="relative z-10 flex min-h-dvh flex-col">
        <Navbar />

        <main id="main" className="flex-1">
          {/* key 绑定路由：某个页面抛错后切换路由能重新挂载，不必手动刷新 */}
          <ErrorBoundary key={pathname}>
            <Suspense fallback={<PageLoading label="正在加载页面" />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>

        <Footer />
      </div>
    </div>
  )
}
