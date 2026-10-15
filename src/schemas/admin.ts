import { z } from 'zod'

import type { BlogFrontmatter, ProjectFrontmatter } from './content'
import type { AccentKey } from '@/data/settings'
import type { Post, Profile, Project } from '@/api/types'

/**
 * 后台表单的校验规则。
 *
 * 与 `content.ts`（Markdown frontmatter）的分工：
 * - `content.ts` 校验**仓库里的 Markdown 文件**，字段少、容忍缺省，构建期生效；
 * - 本文件校验**后台表单的输入**，字段多（正文、slug、重复项都算），运行期生效。
 *
 * 两者共享同一套落盘形状：表单校验通过后由下面的 `toBlogFrontmatter` /
 * `toProjectFrontmatter` 转成 frontmatter，再交给 `src/api` 写入。
 * 因此改字段时两边都要看 —— 这也是刻意放在同一个目录里的原因。
 */

const isoDate = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式需为 YYYY-MM-DD')

const assetPath = z
  .string()
  .trim()
  .max(200, '路径过长')
  .refine(
    (value) => value === '' || value.startsWith('/') || /^https?:\/\//.test(value),
    '请填写以 / 开头的站内路径，或完整的 http(s) 链接',
  )

const optionalUrl = z
  .string()
  .trim()
  .max(200, '链接过长')
  .refine((value) => value === '' || /^https?:\/\//.test(value), '请填写完整的 http(s) 链接')

/** slug 同时用作文件名、URL 与主键，收紧到小写字母数字与连字符 */
export const slugSchema = z
  .string()
  .trim()
  .min(1, '请填写 slug')
  .max(80, 'slug 最多 80 个字符')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, '只能使用小写字母、数字与连字符（如 my-first-post）')

export const tagsSchema = z
  .array(z.string().trim().min(1, '标签不能为空').max(20, '单个标签最多 20 个字'))
  .max(10, '标签最多 10 个')

/** 把 ZodError 压成「字段 → 第一条错误」的映射，供表单逐字段展示 */
export function firstFieldErrors<T extends string>(
  error: z.ZodError,
): Partial<Record<T, string>> {
  const flattened = error.flatten().fieldErrors as Record<string, string[] | undefined>
  const result: Partial<Record<T, string>> = {}

  for (const [field, messages] of Object.entries(flattened)) {
    const first = messages?.[0]
    if (first) result[field as T] = first
  }

  return result
}

/** 数组项的嵌套错误（如 `experience.0.title`）压不进字段映射，单独取出给人看 */
export function collectMessages(error: z.ZodError, limit = 3): string[] {
  return error.issues.slice(0, limit).map((issue) => {
    const path = issue.path.join('.')
    return path ? `${path}：${issue.message}` : issue.message
  })
}

/* ------------------------------------------------------------------
   登录
   ------------------------------------------------------------------ */

export const loginSchema = z.object({
  username: z.string().trim().min(1, '请输入账号').max(60, '账号过长'),
  password: z.string().min(1, '请输入密码').max(72, '密码过长'),
})

export type LoginValues = z.infer<typeof loginSchema>
export type LoginFieldErrors = Partial<Record<'username' | 'password', string>>

/* ------------------------------------------------------------------
   博客 / 项目
   ------------------------------------------------------------------ */

export const postFormSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1, '请填写标题').max(80, '标题最多 80 个字'),
  description: z.string().trim().min(1, '请填写摘要').max(160, '摘要最多 160 个字'),
  date: isoDate,
  /** 空串表示不填 */
  updated: z.union([isoDate, z.literal('')]),
  tags: tagsSchema,
  cover: assetPath,
  draft: z.boolean(),
  body: z.string().min(1, '正文不能为空').max(200_000, '正文过长'),
})

export type PostFormValues = z.infer<typeof postFormSchema>
export type PostFieldErrors = Partial<Record<keyof PostFormValues, string>>

export const projectFormSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1, '请填写标题').max(80, '标题最多 80 个字'),
  description: z.string().trim().min(1, '请填写摘要').max(120, '摘要最多 120 个字'),
  date: isoDate,
  tags: tagsSchema,
  cover: assetPath,
  role: z.string().trim().max(40, '角色最多 40 个字'),
  period: z.string().trim().max(40, '时间段最多 40 个字'),
  repo: optionalUrl,
  demo: optionalUrl,
  featured: z.boolean(),
  status: z.enum(['active', 'wip', 'archived']),
  body: z.string().min(1, '正文不能为空').max(200_000, '正文过长'),
})

export type ProjectFormValues = z.infer<typeof projectFormSchema>
export type ProjectFieldErrors = Partial<Record<keyof ProjectFormValues, string>>

/**
 * 持久化形状 → 表单初值。
 *
 * 可选字段补成空串，受控输入才不用到处写 `?? ''`。与 `toProfileValues` 同一个理由：
 * 「数据里没有」和「用户还没填」在表单里必须是同一种表现，否则输入框会在
 * `undefined` 与 `''` 之间来回切换，React 会警告非受控变受控。
 */
export function toPostFormValues(post: Post): PostFormValues {
  const { frontmatter } = post

  return {
    slug: post.slug,
    title: frontmatter.title,
    description: frontmatter.description,
    date: frontmatter.date,
    updated: frontmatter.updated ?? '',
    tags: frontmatter.tags,
    cover: frontmatter.cover ?? '',
    draft: frontmatter.draft,
    body: post.body,
  }
}

export function toProjectFormValues(project: Project): ProjectFormValues {
  const { frontmatter } = project

  return {
    slug: project.slug,
    title: frontmatter.title,
    description: frontmatter.description,
    date: frontmatter.date,
    tags: frontmatter.tags,
    cover: frontmatter.cover ?? '',
    role: frontmatter.role ?? '',
    period: frontmatter.period ?? '',
    repo: frontmatter.links.repo ?? '',
    demo: frontmatter.links.demo ?? '',
    featured: frontmatter.featured,
    status: frontmatter.status,
    body: project.body,
  }
}

export function toBlogFrontmatter(values: PostFormValues): BlogFrontmatter {
  return {
    title: values.title,
    description: values.description,
    date: values.date,
    ...(values.updated ? { updated: values.updated } : {}),
    tags: values.tags,
    ...(values.cover ? { cover: values.cover } : {}),
    draft: values.draft,
  }
}

export function toProjectFrontmatter(values: ProjectFormValues): ProjectFrontmatter {
  return {
    title: values.title,
    description: values.description,
    date: values.date,
    tags: values.tags,
    ...(values.cover ? { cover: values.cover } : {}),
    ...(values.role ? { role: values.role } : {}),
    ...(values.period ? { period: values.period } : {}),
    links: {
      ...(values.repo ? { repo: values.repo } : {}),
      ...(values.demo ? { demo: values.demo } : {}),
    },
    featured: values.featured,
    status: values.status,
  }
}

/* ------------------------------------------------------------------
   个人信息
   ------------------------------------------------------------------ */

export const socialLinkSchema = z.object({
  label: z.string().trim().min(1, '请填写名称').max(30, '名称最多 30 个字'),
  url: z.string().trim().url('请填写完整的链接').max(200, '链接过长'),
  icon: z.string().trim().max(40, '图标名过长'),
})

export const experienceItemSchema = z.object({
  id: z.string().trim().min(1),
  period: z.string().trim().min(1, '请填写时间段').max(40, '时间段最多 40 个字'),
  title: z.string().trim().min(1, '请填写名称').max(80, '名称最多 80 个字'),
  org: z.string().trim().max(80, '组织最多 80 个字'),
  description: z.string().trim().max(600, '描述最多 600 个字'),
  type: z.enum(['education', 'project']),
  highlights: z.array(z.string().trim().min(1, '要点不能为空').max(200, '单条要点最多 200 个字')),
})

export const awardItemSchema = z.object({
  name: z.string().trim().min(1, '请填写奖项名称').max(120, '名称最多 120 个字'),
  detail: z.string().trim().max(60, '说明最多 60 个字'),
  /** 允许留空（原始简历里就有不带日期的条目），格式形如 2025.06 */
  date: z
    .string()
    .trim()
    .regex(/^$|^\d{4}\.\d{2}$/, '日期形如 2025.06，或留空'),
})

export const awardGroupSchema = z.object({
  level: z.string().trim().min(1, '请填写级别').max(20, '级别最多 20 个字'),
  items: z.array(awardItemSchema).max(30, '单组最多 30 条'),
})

export const profileSchema = z.object({
  name: z.string().trim().min(1, '请填写名字').max(40, '名字最多 40 个字'),
  role: z.string().trim().max(80, '身份最多 80 个字'),
  org: z.string().trim().max(80, '组织最多 80 个字'),
  tagline: z.string().trim().max(200, '简介最多 200 个字'),
  bio: z.array(z.string().trim().min(1, '段落不能为空').max(600, '单段最多 600 个字')).max(20, '最多 20 段'),
  location: z.string().trim().max(60, '城市最多 60 个字'),
  email: z.string().trim().email('邮箱格式不正确').max(120, '邮箱过长'),
  phone: z.string().trim().max(30, '电话最多 30 个字'),
  avatar: assetPath,
  resumeUrl: assetPath,
  socials: z.array(socialLinkSchema).max(10, '最多 10 个社交链接'),
  experience: z.array(experienceItemSchema).max(30, '最多 30 条经历'),
  awards: z.array(awardGroupSchema).max(20, '最多 20 组奖项'),
})

export type ProfileValues = z.infer<typeof profileSchema>
export type ProfileFieldErrors = Partial<Record<keyof ProfileValues, string>>

/** 表单 → 持久化形状：`resumeUrl` 空串在 `Profile` 里表示为「不渲染下载按钮」 */
export function toProfile(values: ProfileValues): Profile {
  return {
    ...values,
    resumeUrl: values.resumeUrl === '' ? undefined : values.resumeUrl,
  }
}

/** 持久化形状 → 表单初值：把可选字段补成空串/空数组，受控输入才好处理 */
export function toProfileValues(profile: Profile): ProfileValues {
  return {
    ...profile,
    resumeUrl: profile.resumeUrl ?? '',
    experience: profile.experience.map((item) => ({
      ...item,
      highlights: item.highlights ?? [],
    })),
  }
}

/* ------------------------------------------------------------------
   技能
   ------------------------------------------------------------------ */

export const skillLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
])

export const skillItemSchema = z.object({
  name: z.string().trim().min(1, '请填写技能名').max(40, '技能名最多 40 个字'),
  level: skillLevelSchema,
  icon: z.string().trim().max(40, '图标名过长'),
})

export const skillGroupSchema = z.object({
  category: z.string().trim().min(1, '请填写分类名').max(30, '分类名最多 30 个字'),
  items: z.array(skillItemSchema).min(1, '每个分类至少保留一项技能').max(30, '单组最多 30 项'),
})

export type SkillGroupValues = z.infer<typeof skillGroupSchema>
export type SkillItemValues = z.infer<typeof skillItemSchema>
export type SkillFieldErrors = Partial<Record<keyof SkillGroupValues, string>>

/* ------------------------------------------------------------------
   站点设置
   ------------------------------------------------------------------ */

export const settingsSchema = z.object({
  siteTitle: z.string().trim().min(1, '请填写站点标题').max(40, '标题最多 40 个字'),
  siteDescription: z.string().trim().max(160, '描述最多 160 个字'),
  accent: z.enum(['sky', 'violet', 'aurora']),
  starfieldEnabled: z.boolean(),
  // NumberField 在输入框清空时交出 NaN，Zod 的 number 类型会拒绝它。
  // 不给 `error` 的话这里会漏出英文的默认提示，所以显式写中文。
  homeProjectCount: z
    .number({ error: '请填写整数' })
    .int('请填写整数')
    .min(1, '至少 1 条')
    .max(12, '最多 12 条'),
  homePostCount: z
    .number({ error: '请填写整数' })
    .int('请填写整数')
    .min(1, '至少 1 条')
    .max(12, '最多 12 条'),
  footerNote: z.string().trim().max(120, '页脚文字最多 120 个字'),
})

export type SettingsValues = z.infer<typeof settingsSchema>
export type SettingsFieldErrors = Partial<Record<keyof SettingsValues, string>>

export const ACCENT_KEYS: readonly AccentKey[] = ['sky', 'violet', 'aurora']
