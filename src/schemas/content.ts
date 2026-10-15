import { z } from 'zod'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式需为 YYYY-MM-DD')

export const blogFrontmatterSchema = z.object({
  title: z.string().min(1).max(80),
  description: z.string().min(1).max(160),
  date: isoDate,
  updated: isoDate.optional(),
  tags: z.array(z.string()).default([]),
  cover: z.string().optional(),
  draft: z.boolean().default(false),
  readingTime: z.number().positive().optional(),
})

export const projectFrontmatterSchema = z.object({
  title: z.string().min(1).max(80),
  description: z.string().min(1).max(120),
  date: isoDate,
  cover: z.string().optional(),
  tags: z.array(z.string()).default([]),
  role: z.string().optional(),
  period: z.string().optional(),
  links: z
    .object({
      repo: z.string().url().optional(),
      demo: z.string().url().optional(),
    })
    .default({}),
  featured: z.boolean().default(false),
  status: z.enum(['active', 'wip', 'archived']).default('active'),
})

export type BlogFrontmatter = z.infer<typeof blogFrontmatterSchema>
export type ProjectFrontmatter = z.infer<typeof projectFrontmatterSchema>

export interface TocItem {
  id: string
  text: string
  depth: number
}

export interface MdModuleMeta {
  slug: string
  frontmatter: BlogFrontmatter | ProjectFrontmatter
  headings: TocItem[]
  /** 构建期算好的阅读时长：列表页只有元数据，拿不到正文，所以必须在这里给 */
  readingTime: number
}

export interface MdModule extends MdModuleMeta {
  body: string
}
