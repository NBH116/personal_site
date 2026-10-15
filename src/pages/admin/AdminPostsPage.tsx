import { Plus } from 'lucide-react'
import { useState } from 'react'

import {
  deletePost,
  isPostOverridden,
  isSeedPost,
  listHiddenPostRecords,
  listPostRecords,
  restorePost,
} from '@/api'
import type { PostRecord } from '@/api/types'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { ContentListItem } from '@/components/admin/ContentListItem'
import { FormStatus, type FormStatusKind } from '@/components/admin/FormStatus'
import { ListToolbar, type ListFilterOption } from '@/components/admin/ListToolbar'
import { RecordBadges } from '@/components/admin/RecordBadges'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Tag } from '@/components/ui/Tag'
import { useApiValue } from '@/hooks/useApiValue'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { sortRecordsByDateDesc } from '@/lib/content'

type PostFilter = 'all' | 'published' | 'draft' | 'hidden'

const FILTER_OPTIONS: ListFilterOption[] = [
  { value: 'all', label: '全部' },
  { value: 'published', label: '已发布' },
  { value: 'draft', label: '草稿' },
  { value: 'hidden', label: '已隐藏' },
]

interface Row {
  record: PostRecord
  hidden: boolean
}

function matchesFilter(row: Row, filter: PostFilter): boolean {
  if (filter === 'hidden') return row.hidden
  if (row.hidden) return false
  if (filter === 'draft') return row.record.frontmatter.draft
  if (filter === 'published') return !row.record.frontmatter.draft
  return true
}

function matchesQuery(row: Row, needle: string): boolean {
  if (!needle) return true

  const { title, description } = row.record.frontmatter
  return [title, description, row.record.slug].some((value) =>
    value.toLowerCase().includes(needle),
  )
}

/**
 * 博客管理列表。
 *
 * 列表数据取 `listPostRecords()` 而不是前台的 `getPosts()`：前台视图会按环境过滤草稿，
 * 后台必须看到全部条目，否则「我明明建了草稿却没有」这类问题无从排查。
 *
 * 被删除的种子文章仍然列出（放在「已隐藏」里），因为纯前端方案下它们的 Markdown
 * 文件还在仓库里，只能隐藏不能真正删除 —— 不给恢复入口会让人以为文件被删掉了。
 */
export function AdminPostsPage() {
  const records = useApiValue(listPostRecords)
  const hiddenRecords = useApiValue(listHiddenPostRecords)

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<PostFilter>('all')
  const [status, setStatus] = useState<FormStatusKind>('idle')
  const [message, setMessage] = useState('')
  const [pendingDelete, setPendingDelete] = useState<{ slug: string; title: string } | null>(null)

  useDocumentTitle('博客管理')

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

    deletePost(pendingDelete.slug)
    setPendingDelete(null)
    report(
      'success',
      isSeedPost(pendingDelete.slug)
        ? `已隐藏《${pendingDelete.title}》。它还在 src/content/blog 的 Markdown 里，可以从下方「已隐藏」找回。`
        : `已删除《${pendingDelete.title}》。`,
    )
  }

  const handleRestore = (slug: string, title: string) => {
    restorePost(slug)
    report('success', `已恢复《${title}》的仓库默认内容。`)
  }

  return (
    <>
      <AdminPageHeader
        title="博客管理"
        description="仓库里的 Markdown 文章与后台新建的文章在同一个列表里。后台新建的条目存在浏览器本地，换浏览器就看不到了。"
        actions={
          <ButtonLink to="/admin/posts/new">
            <Plus size={16} aria-hidden="true" />
            新建文章
          </ButtonLink>
        }
      >
        <FormStatus status={status} message={message} />
      </AdminPageHeader>

      <ListToolbar
        id="post-search"
        query={query}
        onQueryChange={setQuery}
        filterLabel="发布状态"
        filterValue={filter}
        filterOptions={FILTER_OPTIONS}
        onFilterChange={(value) => setFilter(value as PostFilter)}
        matched={matched.length}
        total={rows.length}
      />

      <div className="mt-5">
        {rows.length === 0 ? (
          <EmptyState
            title="还没有任何文章"
            description="新建一篇，或在 src/content/blog 下新增 Markdown 文件。"
            action={
              <ButtonLink to="/admin/posts/new">
                <Plus size={16} aria-hidden="true" />
                新建文章
              </ButtonLink>
            }
          />
        ) : matched.length === 0 ? (
          <EmptyState title="没有符合条件的文章" description="换个关键字或筛选条件试试。" />
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
                  editTo={`/admin/posts/${record.slug}`}
                  {...(hidden ? {} : { previewTo: `/blog/${record.slug}` })}
                  hidden={hidden}
                  badges={
                    <>
                      <RecordBadges
                        isSeed={isSeedPost(record.slug)}
                        overridden={isPostOverridden(record.slug)}
                      />
                      {frontmatter.draft ? <Tag tone="accent">草稿</Tag> : null}
                      {hidden ? <Tag tone="accent">已隐藏</Tag> : null}
                    </>
                  }
                  meta={
                    <>
                      <span className="font-mono">{frontmatter.date}</span>
                      <span>{record.readingTime} 分钟</span>
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
        title={`删除文章「${pendingDelete?.title ?? ''}」？`}
        description={
          pendingDelete && isSeedPost(pendingDelete.slug)
            ? '这是一篇来自仓库 Markdown 文件的文章，删除会把它在站点的所有列表与详情页中隐藏。文件本身不会被改动，之后可以从「已隐藏」里恢复。'
            : '这篇文章是后台新建的，删除后无法恢复。'
        }
        confirmLabel="确认删除"
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
