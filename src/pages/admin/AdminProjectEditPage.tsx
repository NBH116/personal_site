import { ArrowLeft, ExternalLink, Save, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import {
  deleteProject,
  getProjectWithBody,
  isProjectOverridden,
  isSeedProject,
  saveProject,
} from '@/api'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { CheckboxField, FormSection, TextAreaField, TextField } from '@/components/admin/Field'
import { FormStatus, type FormStatusKind } from '@/components/admin/FormStatus'
import { MarkdownEditor } from '@/components/admin/MarkdownEditor'
import { RecordBadges } from '@/components/admin/RecordBadges'
import { TagsInput } from '@/components/admin/TagsInput'
import { Button, ButtonLink } from '@/components/ui/Button'
import { projectStatusLabels, projectStatusOrder } from '@/data/projectStatus'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import {
  firstFieldErrors,
  projectFormSchema,
  toProjectFormValues,
  toProjectFrontmatter,
  type ProjectFieldErrors,
  type ProjectFormValues,
} from '@/schemas/admin'

/** 与文章编辑页用同一套章节骨架，读者拿到的是一个可填空的提纲 */
const DEFAULT_BODY = '## 项目背景\n\n\n## 技术方案\n\n\n## 成果\n\n\n## 复盘\n'

function createEmptyProject(): ProjectFormValues {
  return {
    slug: '',
    title: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    tags: [],
    cover: '',
    role: '',
    period: '',
    repo: '',
    demo: '',
    featured: false,
    status: 'active',
    body: DEFAULT_BODY,
  }
}

/**
 * 项目的新建 / 编辑页。结构与 `AdminPostEditPage` 一致，差别只在字段集合：
 * 项目多了 role / period / repo / demo / featured / status。
 *
 * `loadedRef` 的作用与文章页相同：新建保存后 `navigate` 会改变路由参数并触发
 * effect 重跑，靠它跳过那次多余的重载，避免表单闪一下加载态。
 */
export function AdminProjectEditPage() {
  const { slug: routeSlug } = useParams<{ slug: string }>()
  const isNew = routeSlug === undefined
  const navigate = useNavigate()

  const [values, setValues] = useState<ProjectFormValues | null>(() =>
    isNew ? createEmptyProject() : null,
  )
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>(isNew ? 'ready' : 'loading')
  const [errors, setErrors] = useState<ProjectFieldErrors>({})
  const [status, setStatus] = useState<FormStatusKind>('idle')
  const [message, setMessage] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const loadedRef = useRef<string | null>(isNew ? 'new' : null)

  useDocumentTitle(isNew ? '新建项目' : '编辑项目')

  useEffect(() => {
    if (isNew) {
      setState('ready')
      return
    }

    if (loadedRef.current === routeSlug) return

    let cancelled = false
    setState('loading')

    void getProjectWithBody(routeSlug).then((project) => {
      if (cancelled) return

      loadedRef.current = routeSlug

      if (!project) {
        setState('missing')
        return
      }

      setValues(toProjectFormValues(project))
      setState('ready')
    })

    return () => {
      cancelled = true
    }
  }, [routeSlug, isNew])

  const patch = (changes: Partial<ProjectFormValues>) => {
    setValues((previous) => (previous ? { ...previous, ...changes } : previous))
    setStatus('idle')
    setMessage('')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!values) return

    const parsed = projectFormSchema.safeParse(values)

    if (!parsed.success) {
      setErrors(firstFieldErrors<keyof ProjectFormValues>(parsed.error))
      setStatus('error')
      setMessage('有字段没有通过校验，请检查标红的输入框。')
      return
    }

    setErrors({})
    const data = parsed.data

    // slug 同时是 URL 与存储主键，改 slug 等于换一条记录
    if (routeSlug !== undefined && routeSlug !== data.slug) {
      deleteProject(routeSlug)
    }

    saveProject({ slug: data.slug, frontmatter: toProjectFrontmatter(data), body: data.body })

    if (routeSlug !== data.slug) {
      loadedRef.current = data.slug
      navigate(`/admin/projects/${data.slug}`, { replace: true })
    }

    setStatus('success')
    setMessage('已保存。前台页面会立即使用新内容。')
  }

  const handleDelete = () => {
    if (routeSlug === undefined) return

    deleteProject(routeSlug)
    setConfirmDelete(false)
    navigate('/admin/projects', { replace: true })
  }

  if (state === 'loading') {
    return (
      <p className="py-10 text-sm text-fg-muted" role="status">
        正在载入项目…
      </p>
    )
  }

  if (state === 'missing' || !values) {
    return (
      <>
        <AdminPageHeader
          title="找不到这个项目"
          description={`slug 为「${routeSlug ?? ''}」的项目不在当前数据里。它可能已经被删除，或者 slug 写错了。`}
        />
        <ButtonLink to="/admin/projects" variant="secondary">
          <ArrowLeft size={16} aria-hidden="true" />
          返回项目管理
        </ButtonLink>
      </>
    )
  }

  const seed = routeSlug !== undefined && isSeedProject(routeSlug)

  return (
    <form onSubmit={handleSubmit} noValidate>
      <AdminPageHeader
        title={isNew ? '新建项目' : '编辑项目'}
        description="字段与项目 Markdown 的 frontmatter 一一对应。正文用 Markdown 写，右侧实时预览，排版与前台完全一致。"
        actions={
          <>
            <ButtonLink to="/admin/projects" variant="ghost">
              <ArrowLeft size={16} aria-hidden="true" />
              返回列表
            </ButtonLink>
            {routeSlug === undefined ? null : (
              <Button type="button" variant="danger" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={16} aria-hidden="true" />
                删除
              </Button>
            )}
            <Button type="submit">
              <Save size={16} aria-hidden="true" />
              保存
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <FormStatus status={status} message={message} />

          {routeSlug === undefined ? null : (
            <div className="flex flex-wrap items-center gap-2">
              <RecordBadges isSeed={seed} overridden={isProjectOverridden(routeSlug)} />
              <a
                href={`/projects/${routeSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-accent transition-colors duration-200 ease-standard hover:underline"
              >
                <ExternalLink size={12} aria-hidden="true" />
                在新标签页查看前台页面
              </a>
            </div>
          )}
        </div>
      </AdminPageHeader>

      <div className="flex flex-col gap-6">
        <FormSection
          title="基本信息"
          description="slug 决定项目的地址与存储键，只能用英文小写字母、数字与连字符。"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="project-slug"
              label="slug"
              value={values.slug}
              error={errors.slug}
              placeholder="smart-ship-fire-system"
              onChange={(value) => patch({ slug: value })}
            />
            <TextField
              id="project-title"
              label="标题"
              value={values.title}
              error={errors.title}
              onChange={(value) => patch({ title: value })}
            />
          </div>

          <TextAreaField
            id="project-description"
            label="一句话描述"
            rows={2}
            value={values.description}
            error={errors.description}
            hint="卡片上展示的摘要，最多 120 字。"
            onChange={(value) => patch({ description: value })}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              id="project-date"
              label="日期"
              type="date"
              value={values.date}
              error={errors.date}
              hint="用于排序。"
              onChange={(value) => patch({ date: value })}
            />
            <TextField
              id="project-period"
              label="时间段"
              value={values.period}
              error={errors.period}
              placeholder="2025.07 - 2025.10"
              onChange={(value) => patch({ period: value })}
            />
            <TextField
              id="project-role"
              label="我的角色"
              value={values.role}
              error={errors.role}
              placeholder="核心成员 · 前端与算法"
              onChange={(value) => patch({ role: value })}
            />
          </div>

          <TextField
            id="project-cover"
            label="封面路径"
            value={values.cover}
            error={errors.cover}
            placeholder="/images/projects/xxx.webp"
            hint="留空时前台用渐变占位块 + 首字母。"
            onChange={(value) => patch({ cover: value })}
          />

          <TagsInput
            id="project-tags"
            label="技术标签"
            value={values.tags}
            error={errors.tags}
            hint="前台按标签筛选项目，最多 10 个。"
            onChange={(tags) => patch({ tags })}
          />
        </FormSection>

        <FormSection title="链接与状态" description="链接必须是以 http(s) 开头的完整地址，留空则不展示。">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="project-repo"
              label="仓库地址"
              type="url"
              value={values.repo}
              error={errors.repo}
              placeholder="https://github.com/xxx/yyy"
              onChange={(value) => patch({ repo: value })}
            />
            <TextField
              id="project-demo"
              label="演示地址"
              type="url"
              value={values.demo}
              error={errors.demo}
              placeholder="https://example.com"
              onChange={(value) => patch({ demo: value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {projectStatusOrder.map((option) => (
              <label
                key={option}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control border border-border bg-bg px-3 text-sm text-fg transition-colors duration-200 ease-standard hover:bg-surface-hover"
              >
                <input
                  type="radio"
                  name="project-status"
                  value={option}
                  checked={values.status === option}
                  onChange={() => patch({ status: option })}
                  className="size-4 accent-accent"
                />
                {projectStatusLabels[option]}
              </label>
            ))}
          </div>

          <CheckboxField
            id="project-featured"
            label="设为精选项目"
            checked={values.featured}
            hint="精选项目在列表里整体前置，并会出现在首页的项目概览区块。"
            onChange={(featured) => patch({ featured })}
          />
        </FormSection>

        <FormSection title="正文" description="支持 GFM：表格、任务列表、删除线、代码块高亮。">
          <MarkdownEditor
            id="project-body"
            label="Markdown 正文"
            value={values.body}
            error={errors.body}
            onChange={(body) => patch({ body })}
          />
        </FormSection>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-border pt-6">
        <Button type="submit">
          <Save size={16} aria-hidden="true" />
          保存
        </Button>
        <Link
          to="/admin/projects"
          className="text-sm text-fg-muted transition-colors duration-200 ease-standard hover:text-accent"
        >
          返回列表
        </Link>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={`删除项目「${values.title || routeSlug}」？`}
        description={
          seed
            ? '这是一个来自仓库 Markdown 文件的项目，删除会把它在站点的所有列表与详情页中隐藏。文件本身不会被改动，之后可以从「已隐藏」里恢复。'
            : '这个项目是后台新建的，删除后无法恢复。'
        }
        confirmLabel="确认删除"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </form>
  )
}
