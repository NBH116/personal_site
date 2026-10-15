import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAdminSession } from '@/hooks/useAdminSession'

interface RequireAuthProps {
  children: ReactNode
}

/**
 * 后台路由守卫。
 *
 * 判断依据是「当前有没有有效会话」，不是「有没有 token 字符串」——
 * 过期判断在 `src/api/auth.ts` 里，这里不重复实现。
 *
 * 未登录时用 `replace` 跳登录页，并把这一个地址写进 `state.from`：
 * 刷新 `/admin/posts/xxx` 被弹到登录页后，登录成功要回到那一页，
 * 而不是一律落在仪表盘。`replace` 是为了不在历史里留下被拦下的那条记录，
 * 免得用户按返回键在「拦截 → 登录」之间来回弹。
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const session = useAdminSession()
  const location = useLocation()

  if (!session) {
    const from = `${location.pathname}${location.search}`
    return <Navigate to="/admin/login" replace state={{ from }} />
  }

  return <>{children}</>
}
