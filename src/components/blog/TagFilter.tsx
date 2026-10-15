import { cx } from '@/lib/cx'

interface TagFilterProps {
  tags: string[]
  activeTag: string | null
  onChange: (tag: string | null) => void
  /** 用于给不同列表生成唯一的 group 描述 */
  label: string
}

export function TagFilter({ tags, activeTag, onChange, label }: TagFilterProps) {
  if (tags.length === 0) return null

  const options: { value: string | null; text: string }[] = [
    { value: null, text: '全部' },
    ...tags.map((tag) => ({ value: tag, text: tag })),
  ]

  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = activeTag === option.value

        return (
          <button
            key={option.text}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cx(
              'min-h-11 rounded-full px-4 text-sm transition-colors duration-200 ease-standard',
              selected
                ? 'bg-accent-soft text-accent'
                : 'border border-border text-fg-muted hover:text-fg',
            )}
          >
            {option.text}
          </button>
        )
      })}
    </div>
  )
}
