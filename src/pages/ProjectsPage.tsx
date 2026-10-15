import { PageHeader } from '@/components/layout/PageHeader'
import { ProjectGrid } from '@/components/projects/ProjectGrid'
import { TagFilter } from '@/components/blog/TagFilter'
import { useApiValue } from '@/hooks/useApiValue'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { collectTags, getProjects } from '@/lib/content'
import { useMemo, useState } from 'react'

export function ProjectsPage() {
  const projects = useApiValue(getProjects)
  const tags = useMemo(() => collectTags(projects), [projects])
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const filtered = useMemo(
    () => (activeTag ? projects.filter((project) => project.tags.includes(activeTag)) : projects),
    [projects, activeTag],
  )

  useDocumentTitle('项目')

  return (
    <>
      <PageHeader
        title="项目"
        description="完整项目清单，包含创新训练项目与竞赛参赛作品。点击卡片查看背景、方案与成果。"
      >
        <TagFilter
          tags={tags}
          activeTag={activeTag}
          onChange={setActiveTag}
          label="按技术标签筛选项目"
        />
      </PageHeader>

      <div className="mx-auto w-full max-w-content px-gutter py-section sm:px-8 md:py-16">
        <ProjectGrid
          projects={filtered}
          onClearFilter={activeTag ? () => setActiveTag(null) : undefined}
        />
      </div>
    </>
  )
}
