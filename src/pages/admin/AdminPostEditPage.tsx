import { ArrowLeft, ExternalLink, Save, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { deletePost, getPostWithBody, isPostOverridden, isSeedPost, savePost } from '@/api'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { CheckboxField, FormSection, TextAreaField, TextField } from '@/components/admin/Field'
import { FormStatus, type FormStatusKind } from '@/components/admin/FormStatus'
import { MarkdownEditor } from '@/components/admin/MarkdownEditor'
import { RecordBadges } from '@/components/admin/RecordBadges'
import { TagsInput } from '@/components/admin/TagsInput'
import { Button, ButtonLink } from '@/components/ui/Button'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import {
  firstFieldErrors,
  postFormSchema,
  toBlogFrontmatter,
  toPostFormValues,
  type PostFieldErrors,
  type PostFormValues,
} from '@/schemas/admin'

/** 新建时给一份骨架，省得面对一个空白的正文框；用户可以整段删掉 */
const DEFAULT_BODY = '## 背景\n\n\n## 方案\n\n\n## 结论\n'

function createEmptyPost(): PostFormValues {
  return {
    slug: '',
    title: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    updated: '',
    tags: [],
    cover: '',
    draft: true,
    body: DEFAULT_BODY,
  }
}

/**
 * 文章的新建 / 编辑页。
 *
 * 表单只在挂载时（以及路由 slug 变化时）从数据层拉一次，之后完全由本地状态驱动 ——
 * 直接受控于 `getPostWithBody()` 会把用户正在敲的字冲掉。
 *
 * `loadedRef` 是刻意的：新建文章保存后会 `navigate` 到 `/admin/posts/<slug>`，
 * 路由参数一变 effect 就会重跑。如果无条件重新加载，用户会看到表单被替换成
 * 加载指示器再变回来。记下「这个 slug 已经加载过」就能跳过那一次重载。
 */
export function AdminPostEditPage() {
  const { slug: routeSlug } = useParams<{ slug: string }>()
  const isNew = routeSlug === undefined
  const navigate = useNavigate()

  const [values, setValues] = useState<PostFormValues | null>(() => (isNew ? createEmptyPost() : null))
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>(isNew ? 'ready' : 'loading')
  const [errors, setErrors] = useState<PostFieldErrors>({})
  const [status, setStatus] = useState<FormStatusKind>('idle')
  const [message, setMessage] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const loadedRef = useRef<string | null>(isNew ? 'new' : null)

  useDocumentTitle(isNew ? '新建文章' : '编辑文章')

  useEffect(() => {
    if (isNew) {
      setState('ready')
      return
    }

    if (loadedRef.current === routeSlug) return

    let cancelled = false
    setState('loading')

    void getPostWithBody(routeSlug).then((post) => {
      if (cancelled) return

      loadedRef.current = routeSlug

      if (!post) {
        setState('missing')
        return
      }

      setValues(toPostFormValues(post))
      setState('ready')
    })

    return () => {
      cancelled = true
    }
  }, [routeSlug, isNew])

  const patch = (changes: Partial<PostFormValues>) => {
    setValues((previous) => (previous ? { ...previous, ...changes } : previous))
    // 改动之后旧的「已保存」提示不再成立
    setStatus('idle')
    setMessage('')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!values) return

    const parsed = postFormSchema.safeParse(values)

    if (!parsed.success) {
      setErrors(firstFieldErrors<keyof PostFormValues>(parsed.error))
      setStatus('error')
      setMessage('有字段没有通过校验，请检查标红的输入框。')
      return
    }

    setErrors({})
    const data = parsed.data

    // slug 同时是 URL 与存储主键，改 slug 等于换一条记录：不先删掉旧记录的话，
    // 列表里会出现两篇内容相同的文章
    if (routeSlug !== undefined && routeSlug !== data.slug) {
      deletePost(routeSlug)
    }

    savePost({ slug: data.slug, frontmatter: toBlogFrontmatter(data), body: data.body })

    if (routeSlug !== data.slug) {
      loadedRef.current = data.slug
      navigate(`/admin/posts/${data.slug}`, { replace: true })
    }

    setStatus('success')
    setMessage('已保存。前台页面会立即使用新内容。')
  }

  const handleDelete = () => {
    if (routeSlug === undefined) return

    deletePost(routeSlug)
    setConfirmDelete(false)
    navigate('/admin/posts', { replace: true })
  }

  if (state === 'loading') {
    return (
      <p className="py-10 text-sm text-fg-muted" role="status">
        正在载入文章…
      </p>
    )
  }

  if (state === 'missing' || !values) {
    return (
      <>
        <AdminPageHeader
          title="找不到这篇文章"
          description={`slug 为「${routeSlug ?? ''}」的文章不在当前数据里。它可能已经被删除，或者 slug 写错了。`}
        />
        <ButtonLink to="/admin/posts" variant="secondary">
          <ArrowLeft size={16} aria-hidden="true" />
          返回博客管理
        </ButtonLink>
      </>
    )
  }

  const seed = routeSlug !== undefined && isSeedPost(routeSlug)

  return (
    <form onSubmit={handleSubmit} noValidate>
      <AdminPageHeader
        title={isNew ? '新建文章' : '编辑文章'}
        description="字段与 Markdown frontmatter 一一对应。正文用 Markdown 写，右侧实时预览，排版与前台完全一致。"
        actions={
          <>
            <ButtonLink to="/admin/posts" variant="ghost">
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
              <RecordBadges isSeed={seed} overridden={isPostOverridden(routeSlug)} />
              <a
                href={`/blog/${routeSlug}`}
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
          description="slug 决定文章的地址与存储键，只能用英文小写字母、数字与连字符。"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="post-slug"
              label="slug"
              value={values.slug}
              error={errors.slug}
              placeholder="my-first-post"
              onChange={(value) => patch({ slug: value })}
            />
            <TextField
              id="post-title"
              label="标题"
              value={values.title}
              error={errors.title}
              onChange={(value) => patch({ title: value })}
            />
          </div>

          <TextAreaField
            id="post-description"
            label="摘要"
            rows={2}
            value={values.description}
            error={errors.description}
            hint="列表页与分享摘要都用它，建议 60–120 字。"
            onChange={(value) => patch({ description: value })}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              id="post-date"
              label="发布日期"
              type="date"
              value={values.date}
              error={errors.date}
              onChange={(value) => patch({ date: value })}
            />
            <TextField
              id="post-updated"
              label="更新日期"
              type="date"
              value={values.updated}
              error={errors.updated}
              hint="可以留空。"
              onChange={(value) => patch({ updated: value })}
            />
            <TextField
              id="post-cover"
              label="封面路径"
              value={values.cover}
              error={errors.cover}
              placeholder="/images/blog/xxx.webp"
              hint="留空则不展示封面。"
              onChange={(value) => patch({ cover: value })}
            />
          </div>

          <TagsInput
            id="post-tags"
            label="标签"
            value={values.tags}
            error={errors.tags}
            hint="前台按标签筛选文章，最多 10 个。"
            onChange={(tags) => patch({ tags })}
          />

          <CheckboxField
            id="post-draft"
            label="保存为草稿"
            checked={values.draft}
            hint="草稿在开发环境的列表里带「草稿」标记，生产构建中不收录。"
            onChange={(draft) => patch({ draft })}
          />
        </FormSection>

        <FormSection title="正文" description="支持 GFM：表格、任务列表、删除线、代码块高亮。">
          <MarkdownEditor
            id="post-body"
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
          to="/admin/posts"
          className="text-sm text-fg-muted transition-colors duration-200 ease-standard hover:text-accent"
        >
          返回列表
        </Link>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={`删除文章「${values.title || routeSlug}」？`}
        description={
          seed
            ? '这是一篇来自仓库 Markdown 文件的文章，删除会把它在站点的所有列表与详情页中隐藏。文件本身不会被改动，之后可以从「已隐藏」里恢复。'
            : '这篇文章是后台新建的，删除后无法恢复。'
        }
        confirmLabel="确认删除"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </form>
  )
}
