import { X } from 'lucide-react'
import { useState } from 'react'

import { cx } from '@/lib/cx'

import { FieldFrame, fieldDescribedBy, inputClass } from './Field'

interface TagsInputProps {
  id: string
  label: string
  value: string[]
  onChange: (tags: string[]) => void
  hint?: string
  error?: string
  max?: number
}

/**
 * 标签输入。
 *
 * 用「输入框 + 回车/逗号确认」而不是纯文本逗号分隔，是为了顺手把两件事做掉：
 * - 去重（前台用标签当 React key，重复标签会产生重复 key 警告）；
 * - 个数上限（schema 也限制 10 个，这里提前拦住，避免填完才报错）。
 *
 * 已知取舍：胶囊内的删除按钮是 28px，小于 44px 的触摸目标要求。
 * 标签是密集排列的小元素，逐个做成 44px 会让输入区高度失控；
 * 删除按钮有 `aria-label`，键盘与读屏路径完整。
 */
export function TagsInput({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  max = 10,
}: TagsInputProps) {
  const [draft, setDraft] = useState('')

  const commit = (raw: string) => {
    const additions = raw
      .split(/[,，]/)
      .map((tag) => tag.trim())
      .filter(Boolean)

    setDraft('') // 无论有没有新增，都把输入框清空
    if (additions.length === 0) return

    const next = [...value]
    for (const tag of additions) {
      if (next.length >= max) break
      if (!next.includes(tag)) next.push(tag)
    }

    if (next.length !== value.length) onChange(next)
  }

  const remove = (tag: string) => {
    onChange(value.filter((current) => current !== tag))
  }

  const full = value.length >= max

  return (
    <FieldFrame id={id} label={label} hint={hint} error={error}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-accent-soft py-1 pr-1 pl-3 text-xs text-accent"
            >
              {tag}
              <button
                type="button"
                onClick={() => remove(tag)}
                aria-label={`移除标签 ${tag}`}
                className="inline-flex size-7 items-center justify-center rounded-full transition-colors duration-200 ease-standard hover:bg-accent/15"
              >
                <X size={12} aria-hidden="true" />
              </button>
            </span>
          ))}

          {value.length === 0 ? <span className="text-xs text-fg-subtle">还没有标签</span> : null}
        </div>

        <input
          id={id}
          type="text"
          value={draft}
          disabled={full}
          placeholder={full ? `已达到 ${max} 个标签上限` : '输入后按回车或逗号添加'}
          onChange={(event) => {
            const raw = event.target.value
            // 直接输入逗号或粘贴「a, b, c」都在这里一次性收下
            if (raw.includes(',') || raw.includes('，')) {
              commit(raw)
              return
            }
            setDraft(raw)
          }}
          onBlur={() => commit(draft)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault() // 不要触发表单提交
              commit(draft)
              return
            }
            if (event.key === 'Backspace' && draft === '' && value.length > 0) {
              onChange(value.slice(0, -1))
            }
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={fieldDescribedBy(id, error, hint)}
          className={cx(inputClass, error ? 'border-danger' : 'border-border focus:border-accent')}
        />
      </div>
    </FieldFrame>
  )
}
