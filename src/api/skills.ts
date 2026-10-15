import type { SkillGroup } from '@/data/skills'

import { createKeyedCollection } from './collection'
import { seedSkillGroups } from './seed'
import { memoize } from './storage'

/**
 * 技能分组。主键用分类名（「编程语言」等），因为后台是按分类整组编辑的，
 * 条目自身没有稳定 id（简历里的技能名就是它的身份）。
 */

export const SKILLS_STORE_NAME = 'skills'

const store = createKeyedCollection<SkillGroup>({
  name: SKILLS_STORE_NAME,
  keyOf: (group) => group.category,
  seed: seedSkillGroups,
})

export function listSkillGroups(): SkillGroup[] {
  return store.list()
}

export function getSkillGroup(category: string): SkillGroup | null {
  return store.get(category)
}

export function saveSkillGroup(group: SkillGroup): void {
  store.save(group)
}

export function deleteSkillGroup(category: string): void {
  store.remove(category)
}

export function restoreSkillGroup(category: string): void {
  store.restore(category)
}

export function isSkillGroupOverridden(category: string): boolean {
  return store.isOverridden(category)
}

/** 被隐藏的种子技能分类。理由与 `posts.ts` 中的同名函数一致。 */
export function listHiddenSkillGroups(): SkillGroup[] {
  return memoize(`${SKILLS_STORE_NAME}:hidden`, () => {
    const hidden = new Set(store.deletedIds())
    return seedSkillGroups().filter((group) => hidden.has(group.category))
  })
}

export function resetSkills(): void {
  store.reset()
}
