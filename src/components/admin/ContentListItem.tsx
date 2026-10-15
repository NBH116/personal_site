import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { cx } from '@/lib/cx'

import { ContentRowActions } from './ContentRowActions'

interface ContentListItemProps {
  title: string
  description: string
  /** 后台编辑页地址 */
  editTo: string
  /** 前台详情页地址；被隐藏的条目不传，因为它在站点上已经不存在了 */
  previewTo?: string
  /** 被删除（种子条目的墓碑），整行降不透明度并只能恢复 */
  hidden?: boolean
  /** 标题右侧的状态徽标 */
  badges: ReactNode
  /** 底部元信息：日期、时长、标签、状态等，由各页面自己拼 */
  meta: ReactNode
  onRequestDelete: () => void
  onRestore: () => void
}

/**
 * 后台内容列表的一行。
 *
 * 文章列表与项目列表的行结构完全相同（徽标 + 摘要 + 元信息 + 操作），差异全在
 * `badges` 与 `meta` 两个插槽里，所以外壳抽成一个组件；如果连外壳都各写一份，
 * 两边的间距与悬停行为迟早会走样。
 *
 * 被隐藏的行不放 `Link`：条目已经不在集合里，按 slug 打不开编辑页。
 */
export function ContentListItem({
  title,
  description,
  editTo,
  previewTo,
  hidden = false,
  badges,
  meta,
  onRequestDelete,
  onRestore,
}: ContentListItemProps) {
  return (
    <li
      className={cx(
        'rounded-card border border-border bg-surface p-4 transition-colors duration-200 ease-standard sm:p-5',
        hidden ? 'opacity-60' : 'hover:bg-surface-hover',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {hidden ? (
              <span className="truncate text-sm font-medium text-fg">{title}</span>
            ) : (
              <Link
                to={editTo}
                className="truncate text-sm font-medium text-fg transition-colors duration-200 ease-standard hover:text-accent"
              >
                {title}
              </Link>
            )}
            {badges}
          </div>

          <p className="mt-1.5 line-clamp-2 text-sm text-fg-muted">{description}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-fg-subtle">
            {meta}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <ContentRowActions
            title={title}
            editTo={editTo}
            {...(previewTo ? { previewTo } : {})}
            hidden={hidden}
            onRequestDelete={onRequestDelete}
            onRestore={onRestore}
          />
        </div>
      </div>
    </li>
  )
}
