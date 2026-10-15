import { Section } from '@/components/layout/Section'
import { ProjectGrid } from '@/components/projects/ProjectGrid'
import { ButtonLink } from '@/components/ui/Button'
import type { ProjectListItem } from '@/lib/content'

interface ProjectsPreviewProps {
  projects: ProjectListItem[]
  /** 首页展示条数，来自站点设置 */
  limit?: number
}

export function ProjectsPreview({ projects, limit = 3 }: ProjectsPreviewProps) {
  const preview = projects.slice(0, limit)

  return (
    <Section
      id="projects"
      title="项目"
      description="从数据采集到前端呈现的完整实践，点击卡片查看背景、方案与成果。"
    >
      <ProjectGrid projects={preview} />

      {projects.length > limit ? (
        <div className="mt-10">
          <ButtonLink to="/projects" variant="secondary">
            查看全部 {projects.length} 个项目
          </ButtonLink>
        </div>
      ) : null}
    </Section>
  )
}
