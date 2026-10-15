import { PostPreviewList } from '@/components/blog/PostList'
import { Section } from '@/components/layout/Section'
import { ButtonLink } from '@/components/ui/Button'
import type { PostListItem } from '@/lib/content'

interface BlogPreviewProps {
  posts: PostListItem[]
  /** 首页展示条数，来自站点设置 */
  limit?: number
}

export function BlogPreview({ posts, limit = 3 }: BlogPreviewProps) {
  const preview = posts.slice(0, limit)

  return (
    <Section id="blog" title="博客" description="项目复盘、技术笔记与实验记录。">
      <PostPreviewList posts={preview} />

      <div className="mt-8">
        <ButtonLink to="/blog" variant="secondary">
          查看全部文章
        </ButtonLink>
      </div>
    </Section>
  )
}
