import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { getConfiguredUsername, isUsingDefaultCredentials, login } from '@/api'
import { FormStatus } from '@/components/admin/FormStatus'
import { TextField } from '@/components/admin/Field'
import { Starfield } from '@/components/background/Starfield'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useAdminSession } from '@/hooks/useAdminSession'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useSettings } from '@/hooks/useSettings'
import { useSiteAppearance } from '@/hooks/useSiteAppearance'
import { firstFieldErrors, loginSchema, type LoginFieldErrors, type LoginValues } from '@/schemas/admin'

const EMPTY: LoginValues = { username: '', password: '' }

/**
 * 后台登录页。
 *
 * 关于「登录到底保护了什么」：本站是纯客户端应用，凭据来自 `import.meta.env`
 * 并被 Vite 内联进 bundle，所以这层登录只能拦住误入的访客，不是安全边界
 * （详见 `src/api/auth.ts` 的说明）。密码不落 localStorage，只存随机 token。
 *
 * 因此这一页刻意不把密码显示在界面上，即便默认凭据是公开的。
 */
export function AdminLoginPage() {
  const session = useAdminSession()
  const { starfieldEnabled } = useSettings()
  const navigate = useNavigate()
  const location = useLocation()
  const [values, setValues] = useState<LoginValues>(EMPTY)
  const [errors, setErrors] = useState<LoginFieldErrors>({})
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useSiteAppearance()
  useDocumentTitle('后台登录')

  /** 只接受后台内部地址，避免被构造成外部跳转 */
  const rawFrom = (location.state as { from?: unknown } | null)?.from
  const from = typeof rawFrom === 'string' && rawFrom.startsWith('/admin') ? rawFrom : '/admin'

  // 已登录时直接放行：刷新登录页或手动输入地址都不该再看到登录表单
  if (session) return <Navigate to={from} replace />

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const parsed = loginSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(firstFieldErrors<'username' | 'password'>(parsed.error))
      setMessage('请先填写账号与密码。')
      return
    }

    setErrors({})
    setSubmitting(true)

    const result = login(parsed.data.username, parsed.data.password)

    if (!result) {
      setSubmitting(false)
      setMessage('账号或密码不正确。')
      return
    }

    // 会话已经写入存储，守卫会在下一帧放行；这里只需要跳转到目标页面
    navigate(from, { replace: true })
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      {starfieldEnabled ? <Starfield /> : null}

      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-card border border-border bg-surface p-6 sm:p-8">
          <h1 className="text-xl font-semibold text-fg">后台登录</h1>
          <p className="mt-2 text-sm text-fg-muted">
            登录后才能管理个人信息、技能、项目与博客内容。
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
            <TextField
              id="admin-username"
              label="账号"
              value={values.username}
              onChange={(value) => setValues((previous) => ({ ...previous, username: value }))}
              error={errors.username}
              autoComplete="username"
              placeholder={getConfiguredUsername()}
            />

            <TextField
              id="admin-password"
              label="密码"
              type="password"
              value={values.password}
              onChange={(value) => setValues((previous) => ({ ...previous, password: value }))}
              error={errors.password}
              autoComplete="current-password"
            />

            <Button type="submit" disabled={submitting}>
              {submitting ? <Spinner label="正在登录" /> : null}
              {submitting ? '登录中…' : '登录'}
            </Button>

            <FormStatus status={message ? 'error' : 'idle'} message={message} />
          </form>

          {isUsingDefaultCredentials() ? (
            <p className="mt-6 rounded-control border border-border bg-bg p-3 text-xs text-fg-subtle">
              当前使用默认凭据（账号 <code className="font-mono">admin</code>）。请在
              <code className="font-mono"> .env.local </code>
              中设置 <code className="font-mono">VITE_ADMIN_USERNAME</code> 与
              <code className="font-mono"> VITE_ADMIN_PASSWORD</code> 后重启开发服务器。
            </p>
          ) : null}
        </div>

        <p className="mt-6 text-center text-sm">
          <Link
            to="/"
            className="text-fg-muted transition-colors duration-200 ease-standard hover:text-accent"
          >
            返回站点首页
          </Link>
        </p>
      </div>
    </div>
  )
}
