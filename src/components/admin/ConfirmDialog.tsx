import { TriangleAlert, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { Button } from '@/components/ui/Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * 二次确认对话框。
 *
 * 所有删除操作都必须经过它（需求：删除需二次确认）。几个细节是刻意为之：
 * - 默认焦点给「取消」而不是「确认」，破坏性操作不该被一次回车直接执行；
 * - 关闭时把焦点还给触发按钮（打开时记录 `document.activeElement`），否则键盘用户
 *   会掉回文档开头；
 * - 用 `aria-modal` + 自制 Tab 循环代替原生 `<dialog>`：jsdom 没有实现
 *   `showModal()`，用原生元素会让组件测试直接挂掉。
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '确认删除',
  cancelLabel = '取消',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const cancelRef = useRef<HTMLButtonElement | null>(null)

  // 用 ref 承接最新的回调：把 onCancel 放进依赖会让「每次渲染重设焦点」发生，
  // 因为页面传进来的多半是内联箭头函数
  const cancelHandlerRef = useRef(onCancel)
  const confirmHandlerRef = useRef(onConfirm)

  useEffect(() => {
    cancelHandlerRef.current = onCancel
    confirmHandlerRef.current = onConfirm
  })

  useEffect(() => {
    if (!open) return

    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    cancelRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        cancelHandlerRef.current()
        return
      }

      if (event.key !== 'Tab') return

      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (!focusables || focusables.length === 0) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (!first || !last) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
      previous?.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 点击遮罩等于取消；遮罩对读屏不可见，避免多一个没意义的可聚焦元素 */}
      <div
        className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
        onClick={() => cancelHandlerRef.current()}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? 'confirm-dialog-description' : undefined}
        className="relative w-full max-w-md rounded-card border border-border bg-surface p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id="confirm-dialog-title"
            className="flex items-center gap-2 text-base font-semibold text-fg"
          >
            <TriangleAlert size={18} className="shrink-0 text-danger" aria-hidden="true" />
            {title}
          </h2>
          <button
            type="button"
            onClick={() => cancelHandlerRef.current()}
            aria-label="关闭对话框"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-control text-fg-muted transition-colors duration-200 ease-standard hover:bg-surface-hover hover:text-fg"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {description ? (
          <p id="confirm-dialog-description" className="mt-3 text-sm text-fg-muted">
            {description}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button ref={cancelRef} type="button" variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
