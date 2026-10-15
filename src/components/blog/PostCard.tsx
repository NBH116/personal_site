import { Link } from 'react-router-dom'

import { Tag } from '@/components/ui/Tag'
import type { PostListItem } from '@/lib/content'

interface PostCardProps {
  post: PostListItem
}

function formatDate(value: string): string {
  const [year, month, day] = value.split('-')
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="group rounded-card border border-border bg-surface p-6 transition-colors duration-200 ease-standard hover:bg-surface-hover">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-subtle">
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        <span aria-hidden="true">·</span>
        <span>约 {post.readingTime} 分钟</span>
        {post.draft ? <Tag tone="accent">草稿</Tag> : null}
      </div>

      <h3 className="mt-3 text-lg font-semibold text-fg">
        <Link
          to={`/blog/${post.slug}`}
          className="transition-colors duration-200 ease-standard hover:text-accent"
        >
          {post.title}
        </Link>
      </h3>

      <p className="mt-2 text-sm text-fg-muted">{post.description}</p>

      {post.tags.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <li key={tag}>
              <Tag>{tag}</Tag>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}
