import { Check, Mail } from 'lucide-react'

import { useClipboard } from '@/hooks/useClipboard'
import { useProfile } from '@/hooks/useProfile'

/**
 * 邮箱一键复制。
 * 剪贴板不可用时降级提示手动复制，不静默失败（PRD 3.7）。
 */
export function CopyEmail() {
  const { copy, copied, failed } = useClipboard()
  const { email } = useProfile()

  const buttonText = copied ? '已复制' : failed ? '请手动复制' : '复制'

  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href={`mailto:${email}`}
        className="inline-flex min-h-11 items-center gap-2 text-base text-fg transition-colors duration-200 ease-standard hover:text-accent"
      >
        <Mail size={16} aria-hidden="true" />
        {email}
      </a>

      <button
        type="button"
        onClick={() => void copy(email)}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-control border border-border bg-surface px-3 text-sm text-fg-muted transition-colors duration-200 ease-standard hover:bg-surface-hover hover:text-fg"
      >
        {copied ? <Check size={14} aria-hidden="true" /> : null}
        {buttonText}
      </button>

      <span aria-live="polite" className="sr-only">
        {copied ? '邮箱已复制到剪贴板' : failed ? '复制失败，请手动选择邮箱文本复制' : ''}
      </span>
    </div>
  )
}
