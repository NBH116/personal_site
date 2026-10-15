import { TriangleAlert } from 'lucide-react'

import { cx } from '@/lib/cx'

export type FormStatusKind = 'idle' | 'success' | 'error'

interface FormStatusProps {
  status: FormStatusKind
  message: string
  /**
   * 嵌套字段的错误（如「经历第 2 条：请填写时间段」）。
   * 数组项的路径压不进「字段 → 错误」映射，所以在这里单独列出来。
   */
  issues?: string[]
}

const TONE: Record<FormStatusKind, string> = {
  idle: 'text-fg-muted',
  success: 'text-success',
  error: 'text-danger',
}

/**
 * 表单反馈区。
 *
 * 容器始终存在于 DOM 中（`aria-live` 区域必须先在文档里，内容变化才会被播报），
 * 没有内容时只是空的。这一点与直接条件渲染整块提示不同，别改成条件渲染。
 */
export function FormStatus({ status, message, issues = [] }: FormStatusProps) {
  return (
    <div role="status" aria-live="polite" className={cx('text-sm', TONE[status])}>
      {message ? <p>{message}</p> : null}

      {issues.length > 0 ? (
        <ul className="mt-2 flex flex-col gap-1">
          {issues.map((issue) => (
            <li key={issue} className="flex items-start gap-2">
              <TriangleAlert size={14} className="mt-1 shrink-0" aria-hidden="true" />
              <span>{issue}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
