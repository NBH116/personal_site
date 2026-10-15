import { Plus } from 'lucide-react'
import { useState } from 'react'

import {
  deleteProject,
  isProjectOverridden,
  isSeedProject,
  listHiddenProjectRecords,
  listProjectRecords,
  restoreProject,
} from '@/api'
import type { ProjectRecord } from '@/api/types'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { ContentListItem } from '@/components/admin/ContentListItem'
import { FormStatus, type FormStatusKind } from '@/components/admin/FormStatus'
import { ListToolbar, type ListFilterOption } from '@/components/admin/ListToolbar'
import { RecordBadges } from '@/components/admin/RecordBadges'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Tag } from '@/components/ui/Tag'
import { projectStatusLabels, projectStatusOrder } from '@/data/projectStatus'
import type { ProjectStatus } from '@/data/projectStatus'
import { useApiValue } from '@/hooks/useApiValue'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { sortRecordsByDateDesc } from '@/lib/content'

type ProjectFilter = 'all' | ProjectStatus | 'hidden'

const FILTER_OPTIONS: ListFilterOption[] = [
  { value: 'all', label: '全部' },
  ...projectStatusOrder.map((status) => ({
    value: status,
    label: projectStatusLabels[status],
  })),
  { value: 'hidden', label: '已隐藏' },
]

interface Row {
  record: ProjectRecord
  hidden: boolean
}

function matchesFilter(row: Row, filter: ProjectFilter): boolean {
  if (filter === 'hidden') return row.hidden
  if (row.hidden) return false
  if (filter === 'all') return true
  return row.record.frontmatter.status === filter
}

function matchesQuery(row: Row, needle: string): boolean {
  if (!needle) return true

  const { title, description, tags } = row.record.frontmatter
  return [title, description, row.record.slug, ...tags].some((value) =>
    value.toLowerCase().includes(needle),
  )
}

/**
 * 项目管理列表。
 *
 * 列表取 `listProjectRecords()` 而不是前台的 `getProjects()`：前台会过滤掉
 * `archived` 状态与草稿，后台必须看到全部，否则归档过的项目在这里也会「消失」，
 * 用户就只能去手改 localStorage 才能找回来。
 */
export function AdminProjectsPage() {
  const records = useApiValue(listProjectRecords)
  const hiddenRecords = useApiValue(listHiddenProjectRecords)

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ProjectFilter>('all')
  const [status, setStatus] = useState<FormStatusKind>('idle')
  const [message, setMessage] = useState('')
  const [pendingDelete, setPendingDelete] = useState<{ slug: string; title: string } | null>(null)

  useDocumentTitle('项目管理')

  const report = (next: FormStatusKind, text: string) => {
    setStatus(next)
    setMessage(text)
  }

  const rows: Row[] = [
    ...sortRecordsByDateDesc(records).map((record) => ({ record, hidden: false })),
    ...sortRecordsByDateDesc(hiddenRecords).map((record) => ({ record, hidden: true })),
  ]

  const needle = query.trim().toLowerCase()
  const matched = rows.filter(
    (row) => matchesFilter(row, filter) && matchesQuery(row, needle),
  )

  const handleDelete = () => {
    if (!pendingDelete) return

    deleteProject(pendingDelete.slug)
    setPendingDelete(null)
    report(
      'success',
      isSeedProject(pendingDelete.slug)
        ? `已隐藏「${pendingDelete.title}」。它还在 src/content/projects 的 Markdown 里，可以从下方「已隐藏」找回。`
        : `已删除「${pendingDelete.title}」。`,
    )
  }

  const handleRestore = (slug: string, title: string) => {
    restoreProject(slug)
    report('success', `已恢复「${title}」的仓库默认内容。`)
  }

  return (
    <>
      <AdminPageHeader
        title="项目管理"
        description="仓库里的 Markdown 项目与后台新建的项目在同一个列表里。归档状态的项目不出现在前台列表，但在本页始终列出来。"
        actions={
          <ButtonLink to="/admin/projects/new">
            <Plus size={16} aria-hidden="true" />
            新建项目
          </ButtonLink>
        }
      >
        <FormStatus status={status} message={message} />
      </AdminPageHeader>

      <ListToolbar
        id="project-search"
        query={query}
        onQueryChange={setQuery}
        filterLabel="项目状态"
        filterValue={filter}
        filterOptions={FILTER_OPTIONS}
        onFilterChange={(value) => setFilter(value as ProjectFilter)}
        matched={matched.length}
        total={rows.length}
      />

      <div className="mt-5">
        {rows.length === 0 ? (
          <EmptyState
            title="还没有任何项目"
            description="新建一个，或在 src/content/projects 下新增 Markdown 文件。"
            action={
              <ButtonLink to="/admin/projects/new">
                <Plus size={16} aria-hidden="true" />
                新建项目
              </ButtonLink>
            }
          />
        ) : matched.length === 0 ? (
          <EmptyState title="没有符合条件的项目" description="换个关键字或筛选条件试试。" />
        ) : (
          <ul className="flex flex-col gap-3">
            {matched.map(({ record, hidden }) => {
              const { frontmatter } = record
              const title = frontmatter.title

              return (
                <ContentListItem
                  key={`${record.slug}${hidden ? ':hidden' : ''}`}
                  title={title}
                  description={frontmatter.description}
                  editTo={`/admin/projects/${record.slug}`}
                  {...(hidden ? {} : { previewTo: `/projects/${record.slug}` })}
                  hidden={hidden}
                  badges={
                    <>
                      <RecordBadges
                        isSeed={isSeedProject(record.slug)}
                        overridden={isProjectOverridden(record.slug)}
                      />
                      {frontmatter.featured ? <Tag tone="accent">精选</Tag> : null}
                      {hidden ? <Tag tone="accent">已隐藏</Tag> : null}
                    </>
                  }
                  meta={
                    <>
                      <span className="font-mono">{frontmatter.date}</span>
                      <span>{projectStatusLabels[frontmatter.status]}</span>
                      {frontmatter.period ? <span>{frontmatter.period}</span> : null}
                      {frontmatter.role ? <span>{frontmatter.role}</span> : null}
                      <span className="font-mono">{record.slug}</span>
                      {frontmatter.tags.length > 0 ? (
                        <span>标签：{frontmatter.tags.join('、')}</span>
                      ) : null}
                    </>
                  }
                  onRequestDelete={() => setPendingDelete({ slug: record.slug, title })}
                  onRestore={() => handleRestore(record.slug, title)}
                />
              )
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`删除项目「${pendingDelete?.title ?? ''}」？`}
        description={
          pendingDelete && isSeedProject(pendingDelete.slug)
            ? '这是一个来自仓库 Markdown 文件的项目，删除会把它在站点的所有列表与详情页中隐藏。文件本身不会被改动，之后可以从「已隐藏」里恢复。'
            : '这个项目是后台新建的，删除后无法恢复。'
        }
        confirmLabel="确认删除"
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
