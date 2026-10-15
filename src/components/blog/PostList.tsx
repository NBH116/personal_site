import { Link } from 'react-router-dom'

import { ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Reveal } from '@/components/ui/Reveal'
import type { PostListItem } from '@/lib/content'

import { PostCard } from './PostCard'

interface PostListProps {
  posts: PostListItem[]
  /** 命中标签筛选但结果为空时，给一个清除筛选的出口 */
  onClearFilter?: () => void
  emptyTitle?: string
  emptyDescription?: string
}

export function PostList({
  posts,
  onClearFilter,
  emptyTitle = '还没有发布文章',
  emptyDescription = '正在整理笔记，稍后会陆续放出来。',
}: PostListProps) {
  if (posts.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={
          onClearFilter ? (
            <button
              type="button"
              onClick={onClearFilter}
              className="inline-flex min-h-11 items-center rounded-control border border-border bg-surface px-5 text-sm text-fg transition-colors duration-200 ease-standard hover:bg-surface-hover"
            >
              清除筛选
            </button>
          ) : (
            <ButtonLink to="/" variant="secondary" size="sm">
              回到首页
            </ButtonLink>
          )
        }
      />
    )
  }

  return (
    <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post, index) => (
        <li key={post.slug} className="h-full">
          <Reveal className="h-full" delayMs={Math.min(index, 5) * 60}>
            <PostCard post={post} />
          </Reveal>
        </li>
      ))}
    </ul>
  )
}

interface PostPreviewProps {
  posts: PostListItem[]
}

/** 首页的博客预览：三条精简链接，不重复渲染完整卡片网格 */
export function PostPreviewList({ posts }: PostPreviewProps) {
  if (posts.length === 0) {
    return <EmptyState title="还没有发布文章" description="正在整理笔记，稍后会陆续放出来。" />
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {posts.map((post) => (
        <li key={post.slug}>
          <Link
            to={`/blog/${post.slug}`}
            className="flex flex-col gap-1 py-5 transition-colors duration-200 ease-standard hover:text-accent"
          >
            <span className="font-semibold text-fg">{post.title}</span>
            <span className="text-sm text-fg-muted">{post.description}</span>
            <span className="font-mono text-xs text-fg-subtle">
              {post.date} · 约 {post.readingTime} 分钟
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
