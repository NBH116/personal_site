import type { ComponentPropsWithRef, ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { cx } from '@/lib/cx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

const BASE =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-control font-medium transition-colors duration-200 ease-standard disabled:cursor-not-allowed disabled:opacity-60'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-bg hover:bg-accent-strong',
  secondary: 'border border-border bg-surface text-fg hover:bg-surface-hover',
  ghost: 'text-fg-muted hover:bg-surface hover:text-fg',
  // 破坏性操作：后台的删除按钮统一用它，避免各处自己拼红色样式
  danger: 'border border-danger bg-danger-soft text-danger hover:bg-danger/15',
}

const SIZES: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-2.5 text-base',
}

interface CommonProps {
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: CommonProps & ComponentPropsWithRef<'button'>) {
  return (
    <button className={cx(BASE, VARIANTS[variant], SIZES[size], className)} {...rest}>
      {children}
    </button>
  )
}

/**
 * 站内跳转用 `to`（走客户端路由，不整页刷新），外部链接与下载用 `href`。
 * 两种用法共用同一套视觉，所以放在同一个组件里，而不是拆成两个。
 */
type ButtonLinkProps = CommonProps &
  Omit<ComponentPropsWithRef<'a'>, 'children' | 'className'> & {
    to?: string
  }

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  children,
  to,
  ...rest
}: ButtonLinkProps) {
  const classes = cx(BASE, VARIANTS[variant], SIZES[size], className)

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    )
  }

  return (
    <a className={classes} {...rest}>
      {children}
    </a>
  )
}
