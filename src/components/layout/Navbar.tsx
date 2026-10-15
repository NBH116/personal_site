import { Lock, Menu, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { useScrollSpy } from '@/hooks/useScrollSpy'
import { useProfile } from '@/hooks/useProfile'
import { cx } from '@/lib/cx'

type NavItem =
  { type: 'anchor'; id: string; label: string } | { type: 'route'; to: string; label: string }

const NAV_ITEMS: NavItem[] = [
  { type: 'anchor', id: 'about', label: '关于' },
  { type: 'anchor', id: 'skills', label: '技能' },
  { type: 'route', to: '/projects', label: '项目' },
  { type: 'route', to: '/blog', label: '博客' },
  { type: 'anchor', id: 'contact', label: '联系' },
]

/** 只有首页存在这些锚点区块，其他路由不做滚动高亮 */
const HOME_SECTIONS = ['about', 'skills', 'contact']

export function Navbar() {
  const location = useLocation()
  const { name } = useProfile()
  const isHome = location.pathname === '/'
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  const spyIds = useMemo(() => (isHome ? HOME_SECTIONS : []), [isHome])
  const activeSection = useScrollSpy(spyIds)

  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      setScrolled(window.scrollY > 80)
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
  }, [])

  // 路由变化时收起移动端菜单，避免跳转后菜单还盖在页面上
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const firstFocusable = panelRef.current?.querySelector<HTMLElement>('a, button')
    firstFocusable?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        toggleRef.current?.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const linkFor = (item: NavItem) =>
    item.type === 'route' ? item.to : isHome ? `#${item.id}` : `/#${item.id}`

  const isActive = (item: NavItem) => {
    if (item.type === 'route') return location.pathname === item.to
    return isHome && activeSection === item.id
  }

  return (
    <header
      className={cx(
        'sticky top-0 z-40 transition-colors duration-300 ease-standard',
        scrolled
          ? 'border-b border-border bg-bg/80 backdrop-blur-md'
          : 'border-b border-transparent',
      )}
    >
      <div className="mx-auto flex h-14 w-full max-w-content items-center justify-between px-gutter sm:px-8 md:h-16">
        <Link
          to="/"
          className="rounded-control text-sm font-semibold text-fg transition-colors duration-200 ease-standard hover:text-accent"
        >
          {name}
        </Link>

        <nav aria-label="主导航" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <Link
                  to={linkFor(item)}
                  aria-current={isActive(item) ? 'true' : undefined}
                  className={cx(
                    'inline-flex min-h-11 items-center rounded-control px-3 text-sm transition-colors duration-200 ease-standard',
                    isActive(item) ? 'text-accent' : 'text-fg-muted hover:text-fg',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {/* 后台没有其他入口，只能手输地址。这里给一个显式入口：
                已登录时守卫直接放行，未登录则被拦到登录页，登录后回到 /admin */}
            <li className="ml-2 border-l border-border pl-2">
              <Link
                to="/admin"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-control px-3 text-sm text-fg-muted transition-colors duration-200 ease-standard hover:text-fg"
              >
                <Lock size={14} aria-hidden="true" />
                后台
              </Link>
            </li>
          </ul>
        </nav>

        <button
          ref={toggleRef}
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-control text-fg-muted transition-colors duration-200 ease-standard hover:text-fg md:hidden"
          aria-label={menuOpen ? '关闭导航菜单' : '打开导航菜单'}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
      </div>

      {menuOpen ? (
        <div
          id="mobile-menu"
          ref={panelRef}
          className="border-t border-border bg-bg/95 backdrop-blur-md md:hidden"
        >
          <nav aria-label="移动端导航" className="mx-auto w-full max-w-content px-gutter py-4">
            <ul className="flex flex-col">
              {NAV_ITEMS.map((item) => (
                <li key={item.label}>
                  <Link
                    to={linkFor(item)}
                    className={cx(
                      'flex min-h-12 items-center rounded-control px-3 text-base transition-colors duration-200 ease-standard',
                      isActive(item) ? 'text-accent' : 'text-fg-muted hover:text-fg',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="mt-2 border-t border-border pt-2">
                <Link
                  to="/admin"
                  className="flex min-h-12 items-center gap-2 rounded-control px-3 text-base text-fg-muted transition-colors duration-200 ease-standard hover:text-fg"
                >
                  <Lock size={16} aria-hidden="true" />
                  后台
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
