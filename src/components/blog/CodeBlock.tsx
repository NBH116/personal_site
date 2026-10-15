import { Check, Copy } from 'lucide-react'
import type { ReactNode } from 'react'

import { useClipboard } from '@/hooks/useClipboard'

interface CodeBlockProps {
  language: string
  code: string
  children: ReactNode
}

export function CodeBlock({ language, code, children }: CodeBlockProps) {
  const { copy, copied, failed } = useClipboard()

  const copyLabel = copied ? '已复制' : failed ? '复制失败' : '复制代码'

  return (
    <div className="my-6 overflow-hidden rounded-card border border-border bg-surface">
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-2">
        <span className="font-mono text-xs text-fg-subtle">{language || 'text'}</span>
        <button
          type="button"
          onClick={() => void copy(code)}
          className="inline-flex items-center gap-1.5 rounded-control px-2 py-1 text-xs text-fg-muted transition-colors duration-200 ease-standard hover:text-fg"
          aria-label={`复制${language || ''}代码`}
        >
          {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
          {copyLabel}
        </button>
      </div>

      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <code className="font-mono">{children}</code>
      </pre>

      <span aria-live="polite" className="sr-only">
        {copied ? '代码已复制到剪贴板' : failed ? '复制失败，请手动选择代码复制' : ''}
      </span>
    </div>
  )
}
