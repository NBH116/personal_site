import { Suspense, lazy, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import type { Project } from '@/api/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageLoading } from '@/components/layout/PageLoading'
import { Tag } from '@/components/ui/Tag'
import { projectStatusLabels } from '@/data/projectStatus'
import { useApiRevision, useApiValue } from '@/hooks/useApiValue'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getProjects, getProjectBySlug } from '@/lib/content'
import { toToc } from '@/lib/toc'
import { NotFoundPage } from '@/pages/NotFoundPage'

const MarkdownRenderer = lazy(() =>
  import('@/components/blog/MarkdownRenderer').then((module) => ({
    default: module.MarkdownRenderer,
  })),
)

const Toc = lazy(() => import('@/components/blog/Toc').then((module) => ({ default: module.Toc })))


export function ProjectDetailPage() {
  const { slug = '' } = useParams()
  const revision = useApiRevision()
  // 注意：这个 hook 必须在下面的提前 return 之前调用
  const allProjects = useApiValue(getProjects)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    void getProjectBySlug(slug).then((result) => {
      if (cancelled) return
      setProject(result)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [slug, revision])

  const frontmatter = project?.frontmatter
  useDocumentTitle(frontmatter?.title)

  if (loading) return <PageLoading label="正在加载项目" />

  if (!project || !frontmatter) return <NotFoundPage />

  const tocItems = toToc(project.headings)
  const others = allProjects.filter((item) => item.slug !== slug)

  return (
    <article>
      <PageHeader title={frontmatter.title} description={frontmatter.description}>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-fg-subtle">
          {frontmatter.period ? <li>{frontmatter.period}</li> : null}
          {frontmatter.role ? <li>{frontmatter.role}</li> : null}
          <li>{projectStatusLabels[frontmatter.status]}</li>
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

        {frontmatter.links.repo || frontmatter.links.demo ? (
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
            {frontmatter.links.repo ? (
              <a
                href={frontmatter.links.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent underline underline-offset-4"
              >
                仓库地址
              </a>
            ) : null}
            {frontmatter.links.demo ? (
              <a
                href={frontmatter.links.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent underline underline-offset-4"
              >
                在线演示
              </a>
            ) : null}
          </div>
        ) : null}
      </PageHeader>

      <div className="mx-auto flex w-full max-w-content flex-col gap-10 px-gutter py-section sm:px-8 md:py-16 lg:flex-row lg:items-start lg:gap-14">
        <div className="min-w-0 flex-1">
          {frontmatter.cover ? (
            <img
              src={frontmatter.cover}
              alt={`${frontmatter.title} 的封面`}
              className="mb-10 w-full rounded-card border border-border object-cover"
            />
          ) : null}

          <Suspense fallback={<PageLoading label="正在渲染正文" />}>
            <MarkdownRenderer content={project.body} />
          </Suspense>

          <div className="mt-16 border-t border-border pt-8">
            <Link
              to="/projects"
              className="inline-flex min-h-11 items-center rounded-control border border-border bg-surface px-5 text-sm text-fg transition-colors duration-200 ease-standard hover:bg-surface-hover"
            >
              返回项目列表
            </Link>
          </div>
        </div>

        <Suspense fallback={null}>
          <Toc items={tocItems} />
        </Suspense>
      </div>

      {others.length > 0 ? (
        <section
          aria-labelledby="other-projects"
          className="border-t border-border py-section md:py-20"
        >
          <div className="mx-auto w-full max-w-content px-gutter sm:px-8">
            <h2 id="other-projects" className="text-lg font-semibold text-fg">
              其他项目
            </h2>
            <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {others.slice(0, 3).map((project) => (
                <li key={project.slug}>
                  <Link
                    to={`/projects/${project.slug}`}
                    className="flex h-full flex-col gap-1 rounded-card border border-border bg-surface p-5 transition-colors duration-200 ease-standard hover:bg-surface-hover"
                  >
                    <span className="text-sm font-medium text-fg">{project.title}</span>
                    <span className="text-xs text-fg-muted">{project.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </article>
  )
}
