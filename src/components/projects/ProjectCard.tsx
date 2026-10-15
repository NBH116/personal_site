import { Link } from 'react-router-dom'

import { Tag } from '@/components/ui/Tag'
import type { ProjectListItem } from '@/lib/content'

interface ProjectCardProps {
  project: ProjectListItem
}

/** 无封面时的占位：渐变块 + 项目首字（PRD 3.5 异常态） */
function CoverPlaceholder({ title }: { title: string }) {
  return (
    <div
      aria-hidden="true"
      className="flex h-40 items-center justify-center rounded-control border border-border bg-accent-soft"
    >
      <span className="text-3xl font-semibold text-accent">{title.slice(0, 1)}</span>
    </div>
  )
}

export function ProjectCard({ project }: ProjectCardProps) {
  const hasLinks = Boolean(project.links.repo || project.links.demo)

  return (
    <article className="flex h-full flex-col rounded-card border border-border bg-surface p-5 transition-colors duration-200 ease-standard hover:bg-surface-hover">
      {project.cover ? (
        <img
          src={project.cover}
          alt={`${project.title} 的封面`}
          loading="lazy"
          decoding="async"
          className="h-40 w-full rounded-control border border-border object-cover"
        />
      ) : (
        <CoverPlaceholder title={project.title} />
      )}

      <div className="mt-5 flex flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-subtle">
          {project.period ? <span className="font-mono">{project.period}</span> : null}
          {project.featured ? <Tag tone="accent">精选</Tag> : null}
        </div>

        <h3 className="mt-2 text-lg font-semibold text-fg">
          <Link
            to={`/projects/${project.slug}`}
            className="transition-colors duration-200 ease-standard hover:text-accent"
          >
            {project.title}
          </Link>
        </h3>

        {project.role ? <p className="mt-1 text-xs text-fg-muted">{project.role}</p> : null}

        <p className="mt-3 flex-1 text-sm text-fg-muted">{project.description}</p>

        {project.tags.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <li key={tag}>
                <Tag>{tag}</Tag>
              </li>
            ))}
          </ul>
        ) : null}

        {hasLinks ? (
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
            {project.links.repo ? (
              <a
                href={project.links.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-fg-muted transition-colors duration-200 ease-standard hover:text-accent"
              >
                仓库地址
              </a>
            ) : null}
            {project.links.demo ? (
              <a
                href={project.links.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-fg-muted transition-colors duration-200 ease-standard hover:text-accent"
              >
                在线演示
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  )
}
