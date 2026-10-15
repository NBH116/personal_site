import { Eye, PenLine } from 'lucide-react'
import { Suspense, lazy, useState } from 'react'

import { Spinner } from '@/components/ui/Spinner'
import { cx } from '@/lib/cx'
import { estimateReadingTime } from '@/lib/reading-time'

import { FieldFrame, fieldDescribedBy, inputClass } from './Field'

// 与前台详情页共用同一个分包：后台的预览和前台文章渲染必须一模一样，
// 否则会出现「后台看着没问题，发布后排版变了」这类最难查的问题
const MarkdownRenderer = lazy(() =>
  import('@/components/blog/MarkdownRenderer').then((module) => ({
    default: module.MarkdownRenderer,
  })),
)

interface MarkdownEditorProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  error?: string
  rows?: number
}

/**
 * Markdown 编辑器（实时预览）。
 *
 * 宽屏左右分栏、窄屏用「编辑 / 预览」切换。分栏的阈值取 `lg`：
 * 再窄一点两块各只剩二十来列字符，写和读都会难受。
 * 预览复用前台的 `MarkdownRenderer`，因此标题锚点、代码高亮、外链行为全部一致。
 */
export function MarkdownEditor({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  rows = 20,
}: MarkdownEditorProps) {
  const [pane, setPane] = useState<'edit' | 'preview'>('edit')
  const readingTime = estimateReadingTime(value)

  return (
    <FieldFrame id={id} label={label} hint={hint} error={error}>
      <div className="flex flex-col gap-4">
        {/* 窄屏的切换按钮；宽屏两栏同时可见，切换按钮隐藏 */}
        <div className="flex gap-2 lg:hidden" role="group" aria-label="编辑器视图切换">
          <PaneButton
            active={pane === 'edit'}
            icon={PenLine}
            label="编辑"
            onClick={() => setPane('edit')}
          />
          <PaneButton
            active={pane === 'preview'}
            icon={Eye}
            label="预览"
            onClick={() => setPane('preview')}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className={cx('flex flex-col gap-2', pane === 'preview' && 'hidden lg:flex')}>
            <h3 className="hidden text-xs text-fg-subtle lg:block">Markdown 源码</h3>
            <textarea
              id={id}
              rows={rows}
              value={value}
              spellCheck={false}
              onChange={(event) => onChange(event.target.value)}
              placeholder={'## 小标题\n\n正文段落，支持 **加粗**、`行内代码` 与列表。'}
              aria-invalid={Boolean(error)}
              aria-describedby={fieldDescribedBy(id, error, hint)}
              className={cx(
                inputClass,
                'resize-y font-mono leading-relaxed',
                error ? 'border-danger' : 'border-border focus:border-accent',
              )}
            />
            <p className="text-xs text-fg-subtle">
              {value.length} 个字符 · 按当前内容估算约 {readingTime} 分钟
            </p>
          </div>

          <div className={cx('flex flex-col gap-2', pane === 'edit' && 'hidden lg:flex')}>
            <h3 className="hidden text-xs text-fg-subtle lg:block">预览</h3>
            <div className="max-h-[36rem] overflow-auto rounded-control border border-border bg-bg p-4">
              {value.trim() ? (
                <Suspense fallback={<Spinner label="正在渲染预览" className="text-fg-muted" />}>
                  <MarkdownRenderer content={value} />
                </Suspense>
              ) : (
                <p className="text-sm text-fg-subtle">还没有内容，预览会显示在这里。</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </FieldFrame>
  )
}

interface PaneButtonProps {
  active: boolean
  icon: typeof Eye
  label: string
  onClick: () => void
}

function PaneButton({ active, icon: Icon, label, onClick }: PaneButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'inline-flex min-h-11 items-center gap-2 rounded-control border px-4 text-sm transition-colors duration-200 ease-standard',
        active
          ? 'border-accent bg-accent-soft text-accent'
          : 'border-border bg-surface text-fg-muted hover:text-fg',
      )}
    >
      <Icon size={14} aria-hidden="true" />
      {label}
    </button>
  )
}
