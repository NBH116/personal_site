import { useState, type ChangeEvent, type FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { cx } from '@/lib/cx'
import { contactSchema, type ContactFieldErrors, type ContactResponse } from '@/schemas/contact'

type Status = 'idle' | 'submitting' | 'success' | 'error'

const EMPTY_VALUES = { name: '', email: '', message: '', company: '' }

const FIELD_BASE =
  'w-full rounded-control border bg-surface px-4 py-3 text-fg transition-colors duration-200 ease-standard placeholder:text-fg-subtle'

const FIELD_ID = {
  name: 'contact-name',
  email: 'contact-email',
  message: 'contact-message',
} as const

/**
 * 联系表单。
 *
 * 状态机：idle → submitting → success | error（详见 TECH_DESIGN 5.8）。
 * 失败时**保留用户已填内容**，只给出可重试的提示。
 * 注意：`npm run dev` 下 /api/contact 不存在，必须用 `npm run dev:full` 验证。
 */
export function ContactForm() {
  const [values, setValues] = useState(EMPTY_VALUES)
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({})
  const [status, setStatus] = useState<Status>('idle')
  const [statusMessage, setStatusMessage] = useState('')

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setValues((previous) => ({ ...previous, [name]: value }))
  }

  const validateField = (field: 'name' | 'email' | 'message') => {
    const result = contactSchema.safeParse(values)
    const message = result.success ? undefined : result.error.flatten().fieldErrors[field]?.[0]

    setFieldErrors((previous) => ({ ...previous, [field]: message }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const parsed = contactSchema.safeParse(values)

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors
      setFieldErrors({
        name: errors.name?.[0],
        email: errors.email?.[0],
        message: errors.message?.[0],
      })
      setStatus('idle')
      setStatusMessage('请先修正表单中标出的问题。')
      return
    }

    setFieldErrors({})
    setStatus('submitting')
    setStatusMessage('正在发送…')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })

      const payload = (await response.json().catch(() => null)) as ContactResponse | null

      if (response.ok && payload?.ok) {
        setStatus('success')
        setStatusMessage('留言已发送，我会尽快通过邮箱回复你。')
        setValues(EMPTY_VALUES)
        return
      }

      if (payload && !payload.ok) {
        if (payload.fields) setFieldErrors(payload.fields)
        setStatus('error')
        setStatusMessage(payload.message)
        return
      }

      setStatus('error')
      setStatusMessage('发送失败，请稍后重试，或直接发邮件给我。')
    } catch {
      setStatus('error')
      setStatusMessage('网络连接失败，请检查网络后重试，或直接发邮件给我。')
    }
  }

  const submitting = status === 'submitting'

  const describedBy = (field: keyof typeof FIELD_ID) =>
    fieldErrors[field] ? `${FIELD_ID[field]}-error` : undefined

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor={FIELD_ID.name} className="text-sm text-fg">
          称呼
        </label>
        <input
          id={FIELD_ID.name}
          name="name"
          type="text"
          value={values.name}
          onChange={handleChange}
          onBlur={() => validateField('name')}
          autoComplete="name"
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={describedBy('name')}
          className={cx(FIELD_BASE, fieldErrors.name ? 'border-danger' : 'border-border')}
        />
        {fieldErrors.name ? (
          <p id={`${FIELD_ID.name}-error`} className="text-sm text-danger">
            {fieldErrors.name}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={FIELD_ID.email} className="text-sm text-fg">
          邮箱
        </label>
        <input
          id={FIELD_ID.email}
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          onBlur={() => validateField('email')}
          autoComplete="email"
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={describedBy('email')}
          className={cx(FIELD_BASE, fieldErrors.email ? 'border-danger' : 'border-border')}
        />
        {fieldErrors.email ? (
          <p id={`${FIELD_ID.email}-error`} className="text-sm text-danger">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={FIELD_ID.message} className="text-sm text-fg">
          留言
        </label>
        <textarea
          id={FIELD_ID.message}
          name="message"
          rows={5}
          value={values.message}
          onChange={handleChange}
          onBlur={() => validateField('message')}
          aria-invalid={Boolean(fieldErrors.message)}
          aria-describedby={describedBy('message')}
          className={cx(
            FIELD_BASE,
            'resize-y',
            fieldErrors.message ? 'border-danger' : 'border-border',
          )}
        />
        {fieldErrors.message ? (
          <p id={`${FIELD_ID.message}-error`} className="text-sm text-danger">
            {fieldErrors.message}
          </p>
        ) : null}
      </div>

      {/*
        蜜罐字段：正常用户看不到也摸不到，机器人往往会填。
        服务端对 company 非空直接拒绝。
      */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="contact-company">公司（请勿填写）</label>
        <input
          id="contact-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.company}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={submitting}>
          {submitting ? <Spinner label="正在发送" /> : null}
          {submitting ? '发送中…' : '发送留言'}
        </Button>

        <p
          role="status"
          aria-live="polite"
          className={cx(
            'text-sm',
            status === 'success' && 'text-success',
            status === 'error' && 'text-danger',
            (status === 'idle' || status === 'submitting') && 'text-fg-muted',
          )}
        >
          {statusMessage}
        </p>
      </div>
    </form>
  )
}
