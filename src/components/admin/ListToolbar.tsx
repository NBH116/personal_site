import { Search } from 'lucide-react'

import { inputClass } from './Field'
import { cx } from '@/lib/cx'

export interface ListFilterOption {
  value: string
  label: string
}

interface ListToolbarProps {
  id: string
  query: string
  onQueryChange: (value: string) => void
  /** 下拉筛选的名称，同时用作无障碍标签，如「发布状态」 */
  filterLabel: string
  filterValue: string
  filterOptions: ListFilterOption[]
  onFilterChange: (value: string) => void
  /** 当前命中的条数 */
  matched: number
  /** 未筛选时的总条数 */
  total: number
}

/**
 * 后台列表页的搜索 + 状态筛选。
 *
 * 只用 `useState` 保存关键字，不往 URL 里写查询参数：后台是单人使用的工具页，
 * 把筛选状态同步到地址栏只会带来额外的状态来源，收益是负的。
 *
 * 命中数放在 `aria-live` 区域里，键盘用户敲关键字时能听到条数变化。
 */
export function ListToolbar({
  id,
  query,
  onQueryChange,
  filterLabel,
  filterValue,
  filterOptions,
  onFilterChange,
  matched,
  total,
}: ListToolbarProps) {
  const filterId = `${id}-filter`

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-1.5">
        <label htmlFor={id} className="text-sm text-fg">
          搜索
        </label>
        <div className="relative">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-subtle"
          />
          <input
            id={id}
            type="search"
            value={query}
            placeholder="按标题、摘要或 slug 搜索"
            onChange={(event) => onQueryChange(event.target.value)}
            className={cx(inputClass, 'border-border pr-3 pl-9 focus:border-accent')}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 sm:w-44">
        <label htmlFor={filterId} className="text-sm text-fg">
          {filterLabel}
        </label>
        <select
          id={filterId}
          value={filterValue}
          onChange={(event) => onFilterChange(event.target.value)}
          className={cx(inputClass, 'border-border focus:border-accent')}
        >
          {filterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <p aria-live="polite" className="text-xs text-fg-subtle sm:pb-3">
        {matched === total ? `共 ${total} 条` : `命中 ${matched} / ${total} 条`}
      </p>
    </div>
  )
}
