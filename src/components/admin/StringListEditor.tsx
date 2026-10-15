import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { appendItem, moveItem, removeItem, replaceItem } from '@/lib/list'

import { RepeaterCard } from './RepeaterCard'
import { inputClass } from './Field'
import { cx } from '@/lib/cx'

interface StringListEditorProps {
  id: string
  label: string
  items: string[]
  onChange: (items: string[]) => void
  addLabel: string
  placeholder?: string
  /** 多行用于简介段落，单行用于「要点」这类短句 */
  multiline?: boolean
  hint?: string
}

/**
 * 字符串数组编辑器（个人简介的段落、经历要点）。
 *
 * 关于 key 用下标：条目本身就是一段用户可编辑的文本，没有独立身份，用文本当 key
 * 会在每次敲键时重挂载输入框（丢焦点），用下标反而稳定。这是 AGENTS.md
 * 「列表必须有稳定 key」的一个刻意例外，仅适用于「值即身份」的字符串列表。
 */
export function StringListEditor({
  id,
  label,
  items,
  onChange,
  addLabel,
  placeholder,
  multiline = false,
  hint,
}: StringListEditorProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-fg">{label}</p>
          {hint ? <p className="mt-1 text-xs text-fg-subtle">{hint}</p> : null}
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => onChange(appendItem(items, ''))}
        >
          <Plus size={14} aria-hidden="true" />
          {addLabel}
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-card border border-dashed border-border px-4 py-6 text-center text-sm text-fg-subtle">
          还没有内容
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item, index) => {
            const fieldId = `${id}-${index}`

            return (
              <RepeaterCard
                key={index}
                index={index}
                total={items.length}
                title={item.trim() ? item : `${label} ${index + 1}（空）`}
                onMove={(from, to) => onChange(moveItem(items, from, to))}
                onRemove={(target) => onChange(removeItem(items, target))}
              >
                <label htmlFor={fieldId} className="sr-only">
                  {label}第 {index + 1} 项
                </label>
                {multiline ? (
                  <textarea
                    id={fieldId}
                    rows={3}
                    value={item}
                    placeholder={placeholder}
                    onChange={(event) => onChange(replaceItem(items, index, event.target.value))}
                    className={cx(inputClass, 'resize-y border-border focus:border-accent')}
                  />
                ) : (
                  <input
                    id={fieldId}
                    type="text"
                    value={item}
                    placeholder={placeholder}
                    onChange={(event) => onChange(replaceItem(items, index, event.target.value))}
                    className={cx(inputClass, 'border-border focus:border-accent')}
                  />
                )}
              </RepeaterCard>
            )
          })}
        </ul>
      )}
    </div>
  )
}
