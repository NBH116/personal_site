import { awards } from '@/data/awards'
import { experience } from '@/data/experience'
import { defaultSettings, type SiteSettings } from '@/data/settings'
import { skillGroups, type SkillGroup } from '@/data/skills'
import { site } from '@/data/site'
import type { BlogFrontmatter, MdModule, MdModuleMeta, ProjectFrontmatter } from '@/schemas/content'

import type { PostRecord, Profile, ProjectRecord } from './types'

/**
 * 种子数据装配：把现有的 `src/data/*`（结构化数据）与 `src/content/*.md`
 * （经 vite 插件的 Markdown 模块）收敛成数据层的初始状态。
 *
 * 这是「纯前端后台」的关键取舍：种子始终来自仓库里的文件，localStorage 只存
 * 用户改动过的部分。因此 Markdown 文件仍是内容的真相来源，后台是在它之上的
 * 一层可编辑覆盖，而不是替代品。
 */

export function seedProfile(): Profile {
  return {
    name: site.name,
    role: site.role,
    org: site.org,
    tagline: site.tagline,
    bio: site.bio,
    location: site.location,
    email: site.email,
    phone: site.phone,
    avatar: site.avatar,
    ...(site.resumeUrl ? { resumeUrl: site.resumeUrl } : {}),
    socials: site.socials,
    experience,
    awards,
  }
}

export function seedSkillGroups(): SkillGroup[] {
  return skillGroups
}

export function seedSettings(): SiteSettings {
  return defaultSettings
}

/* ------------------------------------------------------------------
   Markdown 种子
   列表页用 `?meta`（只含 frontmatter + headings，正文不进包），
   详情页与后台编辑器才按需懒加载正文。两个变体由 vite.config.ts 的插件产出。
   ------------------------------------------------------------------ */

const postMetaModules = import.meta.glob<MdModuleMeta>('/src/content/blog/*.md', {
  query: '?meta',
  eager: true,
  import: 'default',
})

const postBodyModules = import.meta.glob<MdModule>('/src/content/blog/*.md', {
  import: 'default',
})

const projectMetaModules = import.meta.glob<MdModuleMeta>('/src/content/projects/*.md', {
  query: '?meta',
  eager: true,
  import: 'default',
})

const projectBodyModules = import.meta.glob<MdModule>('/src/content/projects/*.md', {
  import: 'default',
})

function slugFromPath(path: string): string {
  return (path.split('/').pop() ?? '').replace(/\.md$/, '')
}

export function seedPosts(): PostRecord[] {
  return Object.values(postMetaModules).map((module) => ({
    slug: module.slug,
    frontmatter: module.frontmatter as BlogFrontmatter,
    readingTime: module.readingTime,
  }))
}

export function seedProjects(): ProjectRecord[] {
  return Object.values(projectMetaModules).map((module) => ({
    slug: module.slug,
    frontmatter: module.frontmatter as ProjectFrontmatter,
  }))
}

export function seedPostSlugs(): string[] {
  return Object.values(postMetaModules).map((module) => module.slug)
}

export function seedProjectSlugs(): string[] {
  return Object.values(projectMetaModules).map((module) => module.slug)
}

async function loadBody(
  modules: Record<string, () => Promise<MdModule>>,
  slug: string,
): Promise<string | null> {
  const path = Object.keys(modules).find((key) => slugFromPath(key) === slug)
  const loader = path ? modules[path] : undefined
  if (!loader) return null

  const module = await loader()
  return module.body
}

export function loadSeedPostBody(slug: string): Promise<string | null> {
  return loadBody(postBodyModules, slug)
}

export function loadSeedProjectBody(slug: string): Promise<string | null> {
  return loadBody(projectBodyModules, slug)
}
