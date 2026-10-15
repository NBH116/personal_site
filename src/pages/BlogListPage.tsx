import { useMemo, useState } from 'react'

import { PostList } from '@/components/blog/PostList'
import { TagFilter } from '@/components/blog/TagFilter'
import { PageHeader } from '@/components/layout/PageHeader'
import { useApiValue } from '@/hooks/useApiValue'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { collectTags, getPosts } from '@/lib/content'

export function BlogListPage() {
  const posts = useApiValue(getPosts)
  const tags = useMemo(() => collectTags(posts), [posts])
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const filtered = useMemo(
    () => (activeTag ? posts.filter((post) => post.tags.includes(activeTag)) : posts),
    [posts, activeTag],
  )

  useDocumentTitle('博客')

  return (
    <>
      <PageHeader title="博客" description="项目复盘、技术笔记与实验记录。">
        <TagFilter
          tags={tags}
          activeTag={activeTag}
          onChange={setActiveTag}
          label="按标签筛选文章"
        />
      </PageHeader>

      <div className="mx-auto w-full max-w-content px-gutter py-section sm:px-8 md:py-16">
        <PostList
          posts={filtered}
          onClearFilter={activeTag ? () => setActiveTag(null) : undefined}
          emptyTitle={activeTag ? '没有该标签下的文章' : undefined}
          emptyDescription={activeTag ? '换个标签看看，或者清除筛选查看全部文章。' : undefined}
        />
      </div>
    </>
  )
}
