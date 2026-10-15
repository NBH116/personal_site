import type { BlogFrontmatter } from '@/schemas/content'
import { extractHeadings } from '@/lib/headings'
import { estimateReadingTime } from '@/lib/reading-time'

import { readBody, removeBody, writeBody } from './bodies'
import { createKeyedCollection } from './collection'
import { loadSeedPostBody, seedPostSlugs, seedPosts } from './seed'
import { memoize } from './storage'
import type { Post, PostRecord } from './types'

/**
 * 博客文章（不含正文的条目在 localStorage，正文按 slug 单独存）。
 *
 * 读取顺序始终是「localStorage 覆盖 → Markdown 种子文件」：后台编辑过的文章走覆盖，
 * 没碰过的仍然直接读 `src/content/blog/*.md`，所以改 Markdown 文件依然生效。
 */

export const POSTS_STORE_NAME = 'posts'

const store = createKeyedCollection<PostRecord>({
  name: POSTS_STORE_NAME,
  keyOf: (post) => post.slug,
  seed: seedPosts,
})

export function listPostRecords(): PostRecord[] {
  return store.list()
}

export function getPostRecord(slug: string): PostRecord | null {
  return store.get(slug)
}

export function isSeedPost(slug: string): boolean {
  return seedPostSlugs().includes(slug)
}

export function isPostOverridden(slug: string): boolean {
  return store.isOverridden(slug)
}

/**
 * 被隐藏的种子文章：仍在仓库的 Markdown 里，只是后台删除了它们。
 *
 * 必须经 `memoize`：返回的是新数组，直接交给 `useSyncExternalStore` 会被判成
 * 「快照一直在变」而抛无限循环（与 `src/lib/content.ts` 的派生视图同理）。
 * 只有种子条目可恢复；后台新建后又删除的文章不在其中。
 */
export function listHiddenPostRecords(): PostRecord[] {
  return memoize(`${POSTS_STORE_NAME}:hidden`, () => {
    const hidden = new Set(store.deletedIds())
    return seedPosts().filter((post) => hidden.has(post.slug))
  })
}

/** 含正文的完整文章，供详情页与后台编辑器使用 */
export async function getPostWithBody(slug: string): Promise<Post | null> {
  const record = store.get(slug)
  if (!record) return null

  const stored = readBody('post', slug)
  const body = stored ?? (await loadSeedPostBody(slug)) ?? ''

  // 目录锚点当场算：后台新建的文章没有构建期产物，与种子走同一条路径（lib/headings.ts）
  return { ...record, body, headings: extractHeadings(body) }
}

export interface SavePostInput {
  slug: string
  frontmatter: BlogFrontmatter
  body: string
}

export function savePost(input: SavePostInput): void {
  const { slug, frontmatter, body } = input

  // 阅读时长在保存时算一次并落盘，列表页就不必为了一个数字加载全部正文
  const readingTime = frontmatter.readingTime ?? estimateReadingTime(body)

  store.save({ slug, frontmatter, readingTime })
  writeBody('post', slug, body)
}

export function deletePost(slug: string): void {
  store.remove(slug)
  removeBody('post', slug)
}

/** 取消隐藏：让被删除的种子文章回到列表 */
export function restorePost(slug: string): void {
  store.restore(slug)
  removeBody('post', slug)
}

export function resetPosts(): void {
  store.reset()
}
