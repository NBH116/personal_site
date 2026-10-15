import { CloudDownload, PencilRuler, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Tag } from '@/components/ui/Tag'
import { cx } from '@/lib/cx'

interface RecordBadgesProps {
  /** 是否来自仓库里的 Markdown 或 `src/data`。false 表示这条是后台新建的 */
  isSeed: boolean
  /** 是否在 localStorage 里被改动过 */
  overridden: boolean
  className?: string
}

/**
 * 条目的来源标记。
 *
 * 纯前端方案下这个标记不是装饰：localStorage 里只存「用户改过的部分」，仓库里的
 * Markdown 与 `src/data` 始终是兜底默认值。不把来源写出来，用户改完一篇文章会
 * 以为仓库里的 `.md` 文件也跟着变了。
 */
export function RecordBadges({ isSeed, overridden, className }: RecordBadgesProps) {
  const badge: { icon: LucideIcon; label: string; tone: 'default' | 'accent' } = !isSeed
    ? { icon: Sparkles, label: '后台新建', tone: 'accent' }
    : overridden
      ? { icon: PencilRuler, label: '已修改', tone: 'accent' }
      : { icon: CloudDownload, label: '仓库条目', tone: 'default' }

  const Icon = badge.icon

  return (
    <Tag tone={badge.tone} className={cx('gap-1.5', className)}>
      <Icon size={12} aria-hidden="true" />
      {badge.label}
    </Tag>
  )
}
