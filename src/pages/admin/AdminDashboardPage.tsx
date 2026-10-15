import { FileText, FolderKanban, Pencil, Plus, Settings, UserRound, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { getContentStats } from '@/api'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Card } from '@/components/ui/Card'
import { Tag } from '@/components/ui/Tag'
import { useApiValue } from '@/hooks/useApiValue'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getPosts, getProjects } from '@/lib/content'

const QUICK_ACTIONS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/admin/posts/new', label: '新建文章', icon: Plus },
  { to: '/admin/projects/new', label: '新建项目', icon: Plus },
  { to: '/admin/profile', label: '编辑个人信息', icon: Pencil },
  { to: '/admin/settings', label: '站点设置', icon: Settings },
]

export function AdminDashboardPage() {
  const stats = useApiValue(getContentStats)
  const posts = useApiValue(getPosts)
  const projects = useApiValue(getProjects)

  useDocumentTitle('仪表盘')

  const recentPosts = posts.slice(0, 3)
  const featuredProjects = projects.filter((project) => project.featured).slice(0, 3)

  return (
    <>
      <AdminPageHeader
        title="仪表盘"
        description="当前站点内容的概览。这里的数字与实际渲染的页面读的是同一份数据。"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="博客文章"
          value={stats.posts.total}
          hint={`${stats.posts.published} 篇已发布 · ${stats.posts.drafts} 篇草稿`}
          extra={stats.posts.hidden > 0 ? `${stats.posts.hidden} 篇已隐藏` : undefined}
          icon={FileText}
          to="/admin/posts"
        />
        <StatCard
          label="项目"
          value={stats.projects.total}
          hint={`${stats.projects.featured} 个精选 · ${stats.projects.archived} 个已归档`}
          extra={stats.projects.hidden > 0 ? `${stats.projects.hidden} 个已隐藏` : undefined}
          icon={FolderKanban}
          to="/admin/projects"
        />
        <StatCard
          label="技能分类"
          value={stats.skills.groups}
          hint={`共 ${stats.skills.items} 项技能`}
          extra={stats.skills.hidden > 0 ? `${stats.skills.hidden} 组已隐藏` : undefined}
          icon={Wrench}
          to="/admin/skills"
        />
        <StatCard
          label="经历条目"
          value={stats.profile.experience}
          hint={`${stats.profile.awards} 项荣誉 · ${stats.profile.socials} 个社交链接`}
          extra={stats.profile.customized ? '已自定义' : '使用仓库默认内容'}
          icon={UserRound}
          to="/admin/profile"
        />
      </div>

      <section aria-labelledby="quick-actions" className="mt-8">
        <h2 id="quick-actions" className="mb-4 text-sm font-semibold text-fg">
          快捷操作
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <li key={action.label}>
              <Link
                to={action.to}
                className="flex min-h-11 items-center gap-3 rounded-card border border-border bg-surface px-4 py-3 text-sm text-fg transition-colors duration-200 ease-standard hover:bg-surface-hover"
              >
                <action.icon size={16} className="text-accent" aria-hidden="true" />
                {action.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card as="article">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-fg">最近的博客</h2>
            <Link
              to="/admin/posts"
              className="text-xs text-accent transition-colors duration-200 ease-standard hover:underline"
            >
              管理全部
            </Link>
          </div>

          {recentPosts.length === 0 ? (
            <p className="text-sm text-fg-muted">还没有文章。</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {recentPosts.map((post) => (
                <li key={post.slug} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <Link
                      to={`/admin/posts/${post.slug}`}
                      className="block truncate text-sm text-fg transition-colors duration-200 ease-standard hover:text-accent"
                    >
                      {post.title}
                    </Link>
                    <p className="mt-1 font-mono text-xs text-fg-subtle">{post.date}</p>
                  </div>
                  {post.draft ? <Tag tone="accent">草稿</Tag> : null}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card as="article">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-fg">精选项目</h2>
            <Link
              to="/admin/projects"
              className="text-xs text-accent transition-colors duration-200 ease-standard hover:underline"
            >
              管理全部
            </Link>
          </div>

          {featuredProjects.length === 0 ? (
            <p className="text-sm text-fg-muted">还没有标记为精选的项目。</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {featuredProjects.map((project) => (
                <li key={project.slug} className="py-3">
                  <Link
                    to={`/admin/projects/${project.slug}`}
                    className="block truncate text-sm text-fg transition-colors duration-200 ease-standard hover:text-accent"
                  >
                    {project.title}
                  </Link>
                  <p className="mt-1 font-mono text-xs text-fg-subtle">{project.date}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <p className="mt-8 rounded-card border border-border bg-surface p-4 text-xs text-fg-subtle">
        内容改动保存在当前浏览器的 localStorage，仓库里的 Markdown 与 TS 数据始终是兜底默认值。
        换浏览器、清缓存或点「恢复默认内容」都会回到仓库版本。数据访问全部经过
        <code className="font-mono"> src/api</code>，将来接真实后端只需要替换那一层。
      </p>
    </>
  )
}

interface StatCardProps {
  label: string
  value: number
  hint: string
  extra?: string
  icon: LucideIcon
  to: string
}

function StatCard({ label, value, hint, extra, icon: Icon, to }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-fg-muted">{label}</p>
        <Icon size={16} className="text-accent" aria-hidden="true" />
      </div>

      <p className="font-mono text-2xl font-semibold text-fg">{value}</p>
      <p className="text-xs text-fg-muted">{hint}</p>

      <div className="mt-2 flex items-center justify-between gap-2">
        {extra ? <span className="text-xs text-fg-subtle">{extra}</span> : <span />}
        <Link
          to={to}
          className="text-xs text-accent transition-colors duration-200 ease-standard hover:underline"
        >
          管理
        </Link>
      </div>
    </Card>
  )
}
