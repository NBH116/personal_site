import { ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Reveal } from '@/components/ui/Reveal'
import type { ProjectListItem } from '@/lib/content'

import { ProjectCard } from './ProjectCard'

interface ProjectGridProps {
  projects: ProjectListItem[]
  onClearFilter?: () => void
}

export function ProjectGrid({ projects, onClearFilter }: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <EmptyState
        title={onClearFilter ? '没有符合该标签的项目' : '项目整理中'}
        description={
          onClearFilter
            ? '换个标签看看，或者清除筛选查看全部项目。'
            : '项目详情正在补齐，可以先通过邮箱联系我了解。'
        }
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
            <ButtonLink to="/#contact" variant="secondary" size="sm">
              联系我
            </ButtonLink>
          )
        }
      />
    )
  }

  return (
    <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project, index) => (
        <li key={project.slug} className="h-full">
          <Reveal className="h-full" delayMs={Math.min(index, 5) * 60}>
            <ProjectCard project={project} />
          </Reveal>
        </li>
      ))}
    </ul>
  )
}
