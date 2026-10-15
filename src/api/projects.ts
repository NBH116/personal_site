import type { ProjectFrontmatter } from '@/schemas/content'
import { extractHeadings } from '@/lib/headings'

import { readBody, removeBody, writeBody } from './bodies'
import { createKeyedCollection } from './collection'
import { loadSeedProjectBody, seedProjectSlugs, seedProjects } from './seed'
import { memoize } from './storage'
import type { Project, ProjectRecord } from './types'

/**
 * 项目。结构与博客一致：条目与正文分开存，读取时 localStorage 覆盖优先。
 */

export const PROJECTS_STORE_NAME = 'projects'

const store = createKeyedCollection<ProjectRecord>({
  name: PROJECTS_STORE_NAME,
  keyOf: (project) => project.slug,
  seed: seedProjects,
})

export function listProjectRecords(): ProjectRecord[] {
  return store.list()
}

export function getProjectRecord(slug: string): ProjectRecord | null {
  return store.get(slug)
}

export function isSeedProject(slug: string): boolean {
  return seedProjectSlugs().includes(slug)
}

export function isProjectOverridden(slug: string): boolean {
  return store.isOverridden(slug)
}

/** 被隐藏的种子项目。理由与 `posts.ts` 中的同名函数一致。 */
export function listHiddenProjectRecords(): ProjectRecord[] {
  return memoize(`${PROJECTS_STORE_NAME}:hidden`, () => {
    const hidden = new Set(store.deletedIds())
    return seedProjects().filter((project) => hidden.has(project.slug))
  })
}

export async function getProjectWithBody(slug: string): Promise<Project | null> {
  const record = store.get(slug)
  if (!record) return null

  const stored = readBody('project', slug)
  const body = stored ?? (await loadSeedProjectBody(slug)) ?? ''

  return { ...record, body, headings: extractHeadings(body) }
}

export interface SaveProjectInput {
  slug: string
  frontmatter: ProjectFrontmatter
  body: string
}

export function saveProject(input: SaveProjectInput): void {
  const { slug, frontmatter, body } = input

  store.save({ slug, frontmatter })
  writeBody('project', slug, body)
}

export function deleteProject(slug: string): void {
  store.remove(slug)
  removeBody('project', slug)
}

export function restoreProject(slug: string): void {
  store.restore(slug)
  removeBody('project', slug)
}

export function resetProjects(): void {
  store.reset()
}
