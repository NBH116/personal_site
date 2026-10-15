import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'

interface RepeaterCardProps {
  index: number
  total: number
  /** 卡片标题，通常是被编辑项的标题字段；同时用于操作按钮的无障碍名称 */
  title: string
  onMove: (from: number, to: number) => void
  onRemove: (index: number) => void
  children: ReactNode
}

/**
 * 重复项卡片的外壳：标题 + 上移/下移/删除 + 内容。
 *
 * 经历、奖项分组、奖项条目、技能条目、要点都在用它。
 * 顺序有语义（时间线按顺序渲染），所以移动按钮不是装饰。
 *
 * 必须放在 `<ul>` 里：它渲染 `<li>`。
 */
export function RepeaterCard({
  index,
  total,
  title,
  onMove,
  onRemove,
  children,
}: RepeaterCardProps) {
  const actions = [
    {
      key: 'up',
      label: `上移「${title}」`,
      icon: ArrowUp,
      disabled: index === 0,
      onClick: () => onMove(index, index - 1),
    },
    {
      key: 'down',
      label: `下移「${title}」`,
      icon: ArrowDown,
      disabled: index === total - 1,
      onClick: () => onMove(index, index + 1),
    },
    {
      key: 'remove',
      label: `删除「${title}」`,
      icon: Trash2,
      disabled: false,
      onClick: () => onRemove(index),
    },
  ]

  return (
    <li className="rounded-card border border-border bg-bg p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="truncate text-sm font-medium text-fg">{title}</p>

        <div className="flex shrink-0 items-center gap-1">
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={action.onClick}
              disabled={action.disabled}
              aria-label={action.label}
              className={
                action.key === 'remove'
                  ? 'inline-flex size-11 items-center justify-center rounded-control text-fg-muted transition-colors duration-200 ease-standard hover:bg-danger-soft hover:text-danger disabled:opacity-40'
                  : 'inline-flex size-11 items-center justify-center rounded-control text-fg-muted transition-colors duration-200 ease-standard hover:bg-surface-hover hover:text-fg disabled:opacity-40'
              }
            >
              <action.icon size={16} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">{children}</div>
    </li>
  )
}
