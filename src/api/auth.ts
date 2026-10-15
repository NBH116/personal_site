import { memoize, readJson, removeRaw, writeJson } from './storage'
import type { AdminSession } from './types'

/**
 * 后台登录态。
 *
 * ## 这不是安全边界，务必清楚这一点
 *
 * 本站是纯客户端应用，没有后端，也没有数据库（PRD 第六节）。因此这里的「登录」
 * 只能做两件事：把凭据与 `import.meta.env` 里的配置比对，然后发一个随机 token。
 * 由于 Vite 会把环境变量**内联进 bundle**，任何能打开页面的人都能从产物里读出
 * 用户名与密码；localStorage 里的 token 也可以手工伪造。所以它只能拦住「误入
 * /admin 的普通访客」，不能保护任何真实数据 —— 数据本来就在访客自己的浏览器里。
 *
 * 如果将来要把它变成真实鉴权，正确做法是把校验挪到服务端（`api/` 下新增一个
 * 登录接口），token 换成服务端签发并可校验的凭证，前端这一层保持接口不变。
 *
 * ## 已经做到的事
 *
 * 明文密码不落 localStorage：只写 token、用户名与过期时间。
 */

export const SESSION_STORE_NAME = 'admin-session'

/** 与「记住我」无关，纯粹是无人操作时的兜底时长 */
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000

function expectedUsername(): string {
  const configured = import.meta.env.VITE_ADMIN_USERNAME
  return typeof configured === 'string' && configured.length > 0 ? configured : 'admin'
}

function expectedPassword(): string {
  const configured = import.meta.env.VITE_ADMIN_PASSWORD
  return typeof configured === 'string' && configured.length > 0 ? configured : 'admin123'
}

function createToken(): string {
  const bytes = new Uint8Array(24)

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes)
  } else {
    // 极老的浏览器或非安全上下文：退化为 Math.random。
    // token 本身只是「已登录」的标记，不是可校验的凭证，随机性弱化不扩大实际风险。
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256)
    }
  }

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** 校验凭据。失败返回 null，不区分「用户名错」与「密码错」，避免给出枚举提示。 */
export function login(username: string, password: string): AdminSession | null {
  const trimmed = username.trim()

  if (trimmed !== expectedUsername() || password !== expectedPassword()) return null

  const issuedAt = Date.now()
  const session: AdminSession = {
    token: createToken(),
    username: trimmed,
    issuedAt,
    expiresAt: issuedAt + SESSION_TTL_MS,
  }

  writeJson(SESSION_STORE_NAME, session)
  return session
}

/**
 * 读取当前会话。结果被记忆化：`useSyncExternalStore` 要求快照函数返回稳定引用，
 * 每次 `JSON.parse` 出新对象会让 React 直接报错。
 *
 * 因此过期判断发生在缓存被填充的那一刻。登录/登出都会写存储从而清缓存；
 * 长时间挂着页面时由 `useAdminSession` 里的定时器负责到点登出。
 */
export function getSession(): AdminSession | null {
  return memoize(`${SESSION_STORE_NAME}:value`, () => {
    const session = readJson<AdminSession>(SESSION_STORE_NAME)

    if (!session || typeof session.token !== 'string' || session.token.length === 0) return null
    if (typeof session.expiresAt !== 'number' || session.expiresAt <= Date.now()) return null
    if (typeof session.username !== 'string') return null

    return session
  })
}

export function isAuthenticated(): boolean {
  return getSession() !== null
}

export function logout(): void {
  removeRaw(SESSION_STORE_NAME)
}

/** 供设置页展示：当前生效的登录账号名（不含密码） */
export function getConfiguredUsername(): string {
  return expectedUsername()
}

/** 是否在用默认凭据 —— 后台顶部据此提示「请改成自己的账号」 */
export function isUsingDefaultCredentials(): boolean {
  return (
    import.meta.env.VITE_ADMIN_USERNAME === undefined ||
    import.meta.env.VITE_ADMIN_PASSWORD === undefined
  )
}
