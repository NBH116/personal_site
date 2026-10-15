import { Suspense, lazy, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import type { Post } from '@/api/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageLoading } from '@/components/layout/PageLoading'
import { Tag } from '@/components/ui/Tag'
import { useApiRevision } from '@/hooks/useApiValue'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getAdjacentPosts, getPostBySlug, type PostListItem } from '@/lib/content'
import { toToc } from '@/lib/toc'
import { NotFoundPage } from '@/pages/NotFoundPage'

// 解析器与高亮器只进这个分包，首页与列表页不会加载它们（TECH_DESIGN 5.11）
const MarkdownRenderer = lazy(() =>
  import('@/components/blog/MarkdownRenderer').then((module) => ({
    default: module.MarkdownRenderer,
  })),
)

const Toc = lazy(() => import('@/components/blog/Toc').then((module) => ({ default: module.Toc })))

export function BlogPostPage() {
  const { slug = '' } = useParams()
  const revision = useApiRevision()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    void getPostBySlug(slug).then((result) => {
      // 快速切换路由时旧请求可能后到，丢弃它避免渲染错文章
      if (cancelled) return
      setPost(result)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [slug, revision])

  const frontmatter = post?.frontmatter
  useDocumentTitle(frontmatter?.title)

  if (loading) return <PageLoading label="正在加载文章" />

  // 未知 slug 渲染 404 页而不是空白（PRD A10）
  if (!post || !frontmatter) return <NotFoundPage />

  const tocItems = toToc(post.headings)
  const { newer, older } = getAdjacentPosts(slug)

  return (
    <article>
      <PageHeader title={frontmatter.title} description={frontmatter.description}>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-fg-subtle">
          <li>
            <time dateTime={frontmatter.date}>{frontmatter.date}</time>
          </li>
          <li>约 {post.readingTime} 分钟</li>
          {frontmatter.updated ? <li>更新于 {frontmatter.updated}</li> : null}
        </ul>

        {frontmatter.tags.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {frontmatter.tags.map((tag) => (
              <li key={tag}>
                <Tag>{tag}</Tag>
              </li>
            ))}
          </ul>
        ) : null}
      </PageHeader>

      <div className="mx-auto flex w-full max-w-content flex-col gap-10 px-gutter py-section sm:px-8 md:py-16 lg:flex-row lg:items-start lg:gap-14">
        {/* min-w-0 不可省略：否则长代码行会把 flex 子项撑宽，产生横向滚动 */}
        <div className="min-w-0 flex-1">
          <Suspense fallback={<PageLoading label="正在渲染正文" />}>
            <MarkdownRenderer content={post.body} />
          </Suspense>

          <AdjacentPosts newer={newer} older={older} />
        </div>

        <Suspense fallback={null}>
          <Toc items={tocItems} />
        </Suspense>
      </div>
    </article>
  )
}

interface AdjacentPostsProps {
  newer: PostListItem | null
  older: PostListItem | null
}

function AdjacentPosts({ newer, older }: AdjacentPostsProps) {
  if (!newer && !older) return null

  return (
    <nav aria-label="相邻文章" className="mt-16 border-t border-border pt-8">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {newer ? (
          <li>
            <a
              href={`/blog/${newer.slug}`}
              className="flex h-full flex-col gap-1 rounded-card border border-border bg-surface p-5 transition-colors duration-200 ease-standard hover:bg-surface-hover"
            >
              <span className="text-xs text-fg-subtle">更新的文章</span>
              <span className="text-sm text-fg">{newer.title}</span>
            </a>
          </li>
        ) : null}

        {older ? (
          <li className={newer ? undefined : 'sm:col-start-2'}>
            <a
              href={`/blog/${older.slug}`}
              className="flex h-full flex-col gap-1 rounded-card border border-border bg-surface p-5 transition-colors duration-200 ease-standard hover:bg-surface-hover"
            >
              <span className="text-xs text-fg-subtle">更早的文章</span>
              <span className="text-sm text-fg">{older.title}</span>
            </a>
          </li>
        ) : null}
      </ul>
    </nav>
  )
}
