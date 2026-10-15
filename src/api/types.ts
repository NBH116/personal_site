import type { AwardGroup } from '@/data/awards'
import type { ExperienceItem } from '@/data/experience'
import type { SiteSettings } from '@/data/settings'
import type { SkillGroup, SkillItem } from '@/data/skills'
import type { SocialLink } from '@/data/site'
import type { BlogFrontmatter, ProjectFrontmatter, TocItem } from '@/schemas/content'

/**
 * 统一数据层的对外类型。
 *
 * 刻意复用 `src/data/*` 与 `src/schemas/content.ts` 里已有的类型，而不是另起一套：
 * 需求要求「保持与前台数据类型一致」，复用类型是让这件事在编译期成立、
 * 而不是靠人工比对的唯一办法。将来把 localStorage 换成真实后端时，
 * 这些类型就是接口契约。
 */

/** 个人信息 = Hero/关于区块的全部内容 + 经历时间线 + 荣誉奖项 */
export interface Profile {
  name: string
  role: string
  org: string
  tagline: string
  bio: string[]
  location: string
  email: string
  phone: string
  avatar: string
  /** 缺省时 Hero 不渲染「下载简历」按钮 */
  resumeUrl?: string
  socials: SocialLink[]
  experience: ExperienceItem[]
  awards: AwardGroup[]
}

/** 文章条目（不含正文），列表页与仪表盘用 */
export interface PostRecord {
  slug: string
  frontmatter: BlogFrontmatter
  /**
   * 阅读时长。种子条目的值来自构建期插件，后台新建/编辑的条目在保存时算好写进
   * frontmatter，这里统一读出来，避免列表页为了一个数字去加载全部正文。
   */
  readingTime: number
}

export interface Post extends PostRecord {
  body: string
  /** 目录锚点。由正文现算（见 lib/headings.ts），种子与后台新建走同一条路径 */
  headings: TocItem[]
}

/** 项目条目（不含正文） */
export interface ProjectRecord {
  slug: string
  frontmatter: ProjectFrontmatter
}

export interface Project extends ProjectRecord {
  body: string
  headings: TocItem[]
}

/** 登录态。只持久化 token 与过期时间，不落任何形式的密码。 */
export interface AdminSession {
  token: string
  username: string
  issuedAt: number
  expiresAt: number
}

/** 列表条目附加的元信息，供后台标注「种子 / 已修改 / 已隐藏」 */
export interface RecordMeta {
  isSeed: boolean
  isOverridden: boolean
}

export type { AwardGroup, ExperienceItem, SiteSettings, SkillGroup, SkillItem, SocialLink }
