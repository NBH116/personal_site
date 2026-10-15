import { toolIcons } from '@/data/toolIcons'
import { cx } from '@/lib/cx'

interface ToolIconProps {
  slug: string
  className?: string
}

/**
 * 技术栈图标。
 *
 * 图标始终与文字名称并排出现，因此对读屏一律隐藏，避免重复播报。
 * 找不到对应图标时退化为首字母方块，不出现空位或破图（PRD 3.4 异常态）。
 */
export function ToolIcon({ slug, className }: ToolIconProps) {
  const icon = toolIcons[slug]

  if (!icon) {
    return (
      <span
        aria-hidden="true"
        className={cx(
          'inline-flex size-5 items-center justify-center rounded bg-accent-soft font-mono text-[10px] text-accent',
          className,
        )}
      >
        {slug.slice(0, 1).toUpperCase()}
      </span>
    )
  }

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      className={cx('size-5 text-accent', className)}
      fill="currentColor"
    >
      <path d={icon.path} />
    </svg>
  )
}
