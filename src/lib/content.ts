import { getPostWithBody, getProjectWithBody, listPostRecords, listProjectRecords, memoize } from '@/api'
import type { Post, PostRecord, Project, ProjectRecord } from '@/api/types'

/**
 * 前台的派生视图层。
 *
 * 这里**不读文件、不碰 localStorage**：数据一律来自 `src/api`（AGENTS.md 3.1），
 * 本文件只负责把条目整理成页面要的样子 —— 排序、草稿与归档过滤、标签聚合。
 * 后台改了内容，`src/api` 会清缓存并通知订阅者，页面重新调用这里的函数即可拿到新值。
 *
 * 因此每个返回数组的函数都必须经过 `memoize`：`useSyncExternalStore` 要求快照函数
 * 返回稳定引用，每次重算都产生新数组会让 React 直接报无限循环。
 */

/** 开发环境保留草稿并标注，生产构建直接排除（PRD 3.6） */
const INCLUDE_DRAFTS = import.meta.env.DEV

export interface PostListItem {
  slug: string
  title: string
  description: string
  date: string
  updated?: string
  tags: string[]
  cover?: string
  readingTime: number
  draft: boolean
}

export interface ProjectListItem {
  slug: string
  title: string
  description: string
  date: string
  cover?: string
  tags: string[]
  role?: string
  period?: string
  links: { repo?: string; demo?: string }
  featured: boolean
  status: 'active' | 'wip' | 'archived'
}

/* ------------------------------------------------------------------
   纯函数：排序与筛选。与数据来源无关，因此可以脱离 Vite 与浏览器单独测试。
   ------------------------------------------------------------------ */

export function sortByDateDesc<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1))
}

export function filterDrafts<T extends { draft: boolean }>(
  items: T[],
  includeDrafts: boolean,
): T[] {
  return includeDrafts ? items : items.filter((item) => !item.draft)
}

/** 项目排序：featured 整体前置，组内按时间倒序 */
export function sortProjects<T extends { featured: boolean; date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1
    return a.date === b.date ? 0 : a.date < b.date ? 1 : -1
  })
}

/**
 * 按 `frontmatter.date` 倒序，供后台列表使用。
 *
 * 与 `sortByDateDesc` 分开写不是因为逻辑不同，而是因为入参形状不同：集合条目把日期
 * 包在 `frontmatter` 里，让这层结构差异显式存在，好过在每个后台列表页各写一遍比较函数。
 */
export function sortRecordsByDateDesc<T extends { frontmatter: { date: string } }>(
  records: T[],
): T[] {
  return [...records].sort((a, b) => {
    if (a.frontmatter.date === b.frontmatter.date) return 0
    return a.frontmatter.date < b.frontmatter.date ? 1 : -1
  })
}

export function excludeArchived<T extends { status: 'active' | 'wip' | 'archived' }>(
  items: T[],
): T[] {
  return items.filter((item) => item.status !== 'archived')
}

export function collectTags(items: { tags: string[] }[]): string[] {
  return [...new Set(items.flatMap((item) => item.tags))].sort((a, b) =>
    a.localeCompare(b, 'zh-Hans-CN'),
  )
}

/* ------------------------------------------------------------------
   派生视图
   ------------------------------------------------------------------ */

function toPostListItem(record: PostRecord): PostListItem {
  const frontmatter = record.frontmatter
  return {
    slug: record.slug,
    title: frontmatter.title,
    description: frontmatter.description,
    date: frontmatter.date,
    ...(frontmatter.updated ? { updated: frontmatter.updated } : {}),
    tags: frontmatter.tags,
    ...(frontmatter.cover ? { cover: frontmatter.cover } : {}),
    readingTime: record.readingTime,
    draft: frontmatter.draft,
  }
}

function toProjectListItem(record: ProjectRecord): ProjectListItem {
  const frontmatter = record.frontmatter
  return {
    slug: record.slug,
    title: frontmatter.title,
    description: frontmatter.description,
    date: frontmatter.date,
    ...(frontmatter.cover ? { cover: frontmatter.cover } : {}),
    tags: frontmatter.tags,
    ...(frontmatter.role ? { role: frontmatter.role } : {}),
    ...(frontmatter.period ? { period: frontmatter.period } : {}),
    links: frontmatter.links,
    featured: frontmatter.featured,
    status: frontmatter.status,
  }
}

export function getPosts(): PostListItem[] {
  return memoize('view:posts', () => {
    const items = listPostRecords().map(toPostListItem)
    return sortByDateDesc(filterDrafts(items, INCLUDE_DRAFTS))
  })
}

export function getProjects(): ProjectListItem[] {
  return memoize('view:projects', () =>
    sortProjects(excludeArchived(listProjectRecords().map(toProjectListItem))),
  )
}

export function getPostsByTag(tag: string | null): PostListItem[] {
  const posts = getPosts()
  return tag ? posts.filter((post) => post.tags.includes(tag)) : posts
}

export function getProjectsByTag(tag: string | null): ProjectListItem[] {
  const projects = getProjects()
  return tag ? projects.filter((project) => project.tags.includes(tag)) : projects
}

export function getPostBySlug(slug: string): Promise<Post | null> {
  return getPostWithBody(slug)
}

export function getProjectBySlug(slug: string): Promise<Project | null> {
  return getProjectWithBody(slug)
}

/** 详情页底部的上一篇 / 下一篇（PRD 3.6 P1） */
export function getAdjacentPosts(slug: string): {
  newer: PostListItem | null
  older: PostListItem | null
} {
  const posts = getPosts()
  const index = posts.findIndex((post) => post.slug === slug)
  if (index === -1) return { newer: null, older: null }

  return {
    newer: index > 0 ? (posts[index - 1] ?? null) : null,
    older: index < posts.length - 1 ? (posts[index + 1] ?? null) : null,
  }
}
