import { useEffect } from 'react'

import { getSession, logout } from '@/api'
import type { AdminSession } from '@/api/types'

import { useApiValue } from './useApiValue'

/** setTimeout 的上限（2^31 - 1 毫秒，约 24.8 天），超过它会立刻触发 */
const MAX_TIMEOUT_MS = 2_147_483_647

/**
 * 当前后台登录态。
 *
 * 除了订阅存储，还负责「到点自动登出」：会话的过期判断本身只在缓存被填充时做一次
 * （见 `src/api/auth.ts`），如果后台页面一直挂着不动，过期后内存里仍是已登录状态。
 * 定时器把这一点补上，登出会写存储并通知订阅者，路由守卫随即把页面推到登录页。
 */
export function useAdminSession(): AdminSession | null {
  const session = useApiValue(getSession)

  useEffect(() => {
    if (!session) return

    const remaining = session.expiresAt - Date.now()

    if (remaining <= 0) {
      logout()
      return
    }

    // 手工改过 localStorage 的过期时间可能超出定时器上限，此时不设定时器
    if (remaining > MAX_TIMEOUT_MS) return

    const timer = window.setTimeout(() => logout(), remaining)
    return () => window.clearTimeout(timer)
  }, [session])

  return session
}
