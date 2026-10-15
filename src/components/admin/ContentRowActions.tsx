import { Eye, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { cx } from '@/lib/cx'

const ACTION_BASE =
  'inline-flex size-11 shrink-0 items-center justify-center rounded-control text-fg-muted transition-colors duration-200 ease-standard'

interface ActionLinkProps {
  to: string
  icon: LucideIcon
  label: string
  external?: boolean
}

function ActionLink({ to, icon: Icon, label, external }: ActionLinkProps) {
  const className = cx(ACTION_BASE, 'hover:bg-surface-hover hover:text-accent')

  if (external) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" aria-label={label} className={className}>
        <Icon size={16} aria-hidden="true" />
      </a>
    )
  }

  return (
    <Link to={to} aria-label={label} className={className}>
      <Icon size={16} aria-hidden="true" />
    </Link>
  )
}

interface ContentRowActionsProps {
  /** 条目标题，用于拼无障碍名称（「编辑《xxx》」），读屏时才分得清是哪一行 */
  title: string
  /** 后台编辑页地址 */
  editTo: string
  /** 前台详情页地址。后台新建但尚未出现在前台路由里的条目不传 */
  previewTo?: string
  /** 该条是否被删除（种子条目的墓碑），隐藏状态下只能恢复 */
  hidden: boolean
  onRequestDelete: () => void
  onRestore: () => void
}

/**
 * 列表行的操作按钮。
 *
 * 被隐藏的条目只给「恢复」：条目已经不在集合里了，编辑页按 slug 取不到数据，
 * 给一个点进去就是空白的入口没有意义。
 *
 * 删除按钮本身不做确认，只把请求交给父级：列表页只挂一个 `ConfirmDialog`，
 * 而不是每行一个。
 */
export function ContentRowActions({
  title,
  editTo,
  previewTo,
  hidden,
  onRequestDelete,
  onRestore,
}: ContentRowActionsProps) {
  if (hidden) {
    return (
      <button
        type="button"
        onClick={onRestore}
        aria-label={`恢复「${title}」`}
        className={cx(ACTION_BASE, 'hover:bg-surface-hover hover:text-accent')}
      >
        <RotateCcw size={16} aria-hidden="true" />
      </button>
    )
  }

  return (
    <>
      {previewTo ? (
        <ActionLink to={previewTo} icon={Eye} label={`在新标签页打开「${title}」的前台页面`} external />
      ) : null}
      <ActionLink to={editTo} icon={Pencil} label={`编辑「${title}」`} />
      <button
        type="button"
        onClick={onRequestDelete}
        aria-label={`删除「${title}」`}
        className={cx(ACTION_BASE, 'hover:bg-danger-soft hover:text-danger')}
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </>
  )
}
