import {
  ExternalLink,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UserRound,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Suspense, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { logout } from '@/api'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Starfield } from '@/components/background/Starfield'
import { SkipLink } from '@/components/layout/SkipLink'
import { Spinner } from '@/components/ui/Spinner'
import { useAdminSession } from '@/hooks/useAdminSession'
import { useSettings } from '@/hooks/useSettings'
import { useSiteAppearance } from '@/hooks/useSiteAppearance'
import { cx } from '@/lib/cx'

interface AdminNavItem {
  to: string
  label: string
  icon: LucideIcon
  /** 只精确匹配时高亮。仪表盘是 `/admin`，不限制会匹配上所有子路由 */
  exact?: boolean
}

const NAV_ITEMS: AdminNavItem[] = [
  { to: '/admin', label: '仪表盘', icon: LayoutDashboard, exact: true },
  { to: '/admin/profile', label: '个人信息', icon: UserRound },
  { to: '/admin/skills', label: '技能', icon: Wrench },
  { to: '/admin/projects', label: '项目', icon: FolderKanban },
  { to: '/admin/posts', label: '博客', icon: FileText },
  { to: '/admin/settings', label: '站点设置', icon: Settings },
]

/**
 * 后台布局：侧边栏 + 顶栏 + 内容区。
 *
 * 刻意不复用前台的 `Navbar`：前台的导航项是站内区块锚点与公开页面，后台是管理入口，
 * 两者的信息架构没有交集，共用一个组件只会让它长满分支。
 * 视觉沿用同一套令牌，所以两边的深色主题、圆角、动效是一致的。
 *
 * 移动端抽屉的行为与前台 `Navbar` 对齐：锁背景滚动、Esc 关闭、焦点归还给汉堡按钮。
 */
export function AdminLayout() {
  const session = useAdminSession()
  const { siteTitle, starfieldEnabled } = useSettings()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawerToggleRef = useRef<HTMLButtonElement | null>(null)
  const drawerRef = useRef<HTMLDivElement | null>(null)

  useSiteAppearance()

  // 路由变化时收起抽屉，避免跳转后还盖在内容上
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!drawerOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const firstFocusable = drawerRef.current?.querySelector<HTMLElement>('a, button')
    firstFocusable?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setDrawerOpen(false)
      drawerToggleRef.current?.focus()
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [drawerOpen])

  const current = NAV_ITEMS.find((item) =>
    item.exact ? pathname === item.to : pathname.startsWith(item.to),
  )

  const handleLogout = () => {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <>
      <SkipLink target="admin-main" label="跳到管理内容" />
      {starfieldEnabled ? <Starfield /> : null}

      <div className="relative z-10 min-h-dvh lg:pl-60">
        {/* 侧边栏：桌面端固定，移动端由抽屉承担 */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-surface lg:flex">
          <div className="flex h-16 shrink-0 flex-col justify-center border-b border-border px-5">
            <span className="truncate text-sm font-semibold text-fg">{siteTitle}</span>
            <span className="text-xs text-fg-subtle">后台管理</span>
          </div>

          <nav aria-label="后台导航" className="flex-1 overflow-y-auto p-3">
            <AdminNav />
          </nav>

          <div className="shrink-0 border-t border-border p-3">
            <SiteActions onLogout={handleLogout} />
          </div>
        </aside>

        {/* 移动端顶栏 */}
        <div className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-bg/90 px-4 backdrop-blur-md lg:hidden">
          <Link to="/admin" className="truncate text-sm font-semibold text-fg">
            后台管理
          </Link>

          <button
            ref={drawerToggleRef}
            type="button"
            aria-label={drawerOpen ? '关闭后台菜单' : '打开后台菜单'}
            aria-expanded={drawerOpen}
            aria-controls="admin-drawer"
            onClick={() => setDrawerOpen((open) => !open)}
            className="inline-flex size-11 items-center justify-center rounded-control text-fg-muted transition-colors duration-200 ease-standard hover:text-fg"
          >
            {drawerOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>

        {/* 桌面端顶栏：面包屑 + 登录身份 + 退出 */}
        <header className="sticky top-0 z-20 hidden h-16 items-center justify-between gap-4 border-b border-border bg-bg/80 px-6 backdrop-blur-md lg:flex">
          <p className="text-sm text-fg-muted">
            后台
            <span className="mx-2 text-fg-subtle">/</span>
            <span className="text-fg">{current?.label ?? '管理'}</span>
          </p>

          <div className="flex items-center gap-2">
            {session ? (
              <span className="text-xs text-fg-subtle">已登录：{session.username}</span>
            ) : null}
            <SiteActions onLogout={handleLogout} compact />
          </div>
        </header>

        {drawerOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />

            <div
              id="admin-drawer"
              ref={drawerRef}
              className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-border bg-surface"
            >
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
                <span className="text-sm font-semibold text-fg">后台管理</span>
                <button
                  type="button"
                  aria-label="关闭后台菜单"
                  onClick={() => {
                    setDrawerOpen(false)
                    drawerToggleRef.current?.focus()
                  }}
                  className="inline-flex size-11 items-center justify-center rounded-control text-fg-muted transition-colors duration-200 ease-standard hover:text-fg"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              <nav
                aria-label="后台导航（移动端）"
                className="flex-1 overflow-y-auto p-3"
                onClick={() => setDrawerOpen(false)}
              >
                <AdminNav />
              </nav>

              <div className="shrink-0 border-t border-border p-3">
                <SiteActions onLogout={handleLogout} />
              </div>
            </div>
          </div>
        ) : null}

        <main id="admin-main" className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-5xl">
            {/* key 绑定路由：某个页面抛错后切换页面能重新挂载，不必手动刷新 */}
            <ErrorBoundary key={pathname}>
              <Suspense fallback={<AdminLoading />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </>
  )
}

function AdminNav() {
  return (
    <ul className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <li key={item.to}>
          <NavLink
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              cx(
                'flex min-h-11 items-center gap-3 rounded-control px-3 text-sm transition-colors duration-200 ease-standard',
                isActive
                  ? 'bg-accent-soft text-accent'
                  : 'text-fg-muted hover:bg-surface-hover hover:text-fg',
              )
            }
          >
            <item.icon size={16} aria-hidden="true" />
            {item.label}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

function SiteActions({ onLogout, compact }: { onLogout: () => void; compact?: boolean }) {
  const base = compact
    ? 'inline-flex min-h-11 items-center gap-2 rounded-control px-3 text-sm'
    : 'flex min-h-11 items-center gap-2 rounded-control px-3 text-sm'

  return (
    <div className={compact ? 'flex items-center gap-1' : 'flex flex-col gap-1'}>
      <Link
        to="/"
        className={cx(base, 'text-fg-muted transition-colors duration-200 ease-standard hover:text-accent')}
      >
        <ExternalLink size={16} aria-hidden="true" />
        查看站点
      </Link>

      <button
        type="button"
        onClick={onLogout}
        className={cx(base, 'w-full text-fg-muted transition-colors duration-200 ease-standard hover:text-danger')}
      >
        <LogOut size={16} aria-hidden="true" />
        退出登录
      </button>
    </div>
  )
}

function AdminLoading() {
  return (
    <div className="flex items-center gap-3 py-10">
      <Spinner label="正在加载页面" className="text-fg-muted" />
      <span className="text-sm text-fg-muted">正在加载页面…</span>
    </div>
  )
}
