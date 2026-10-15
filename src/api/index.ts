/**
 * 统一数据访问层。
 *
 * 前台与后台都只通过这里读写数据，不直接碰 localStorage、`src/data/*` 或 Markdown 模块。
 * 这样做的目的是把「数据从哪来」收敛成一个可替换的点：将来接上真实后端时，
 * 只需要把这些函数的实现换成 fetch，调用方（页面、组件）不用动。
 *
 * 当前实现 = localStorage 覆盖 + 仓库内的种子数据，纯前端、无网络请求。
 * 已知限制：Markdown 种子条目只能被隐藏，不能被真正删除（见 collection.ts 的说明）。
 */

import { clearBodies } from './bodies'
import { resetPosts } from './posts'
import { resetProfile } from './profile'
import { resetProjects } from './projects'
import { resetSettings } from './settings'
import { resetSkills } from './skills'

export { clearBodies } from './bodies'
export type { ContentKind } from './bodies'

export {
  getConfiguredUsername,
  getSession,
  isAuthenticated,
  isUsingDefaultCredentials,
  login,
  logout,
  SESSION_STORE_NAME,
  SESSION_TTL_MS,
} from './auth'

export {
  getProfile,
  isProfileCustomized,
  resetProfile,
  saveProfile,
} from './profile'

export {
  deleteSkillGroup,
  getSkillGroup,
  isSkillGroupOverridden,
  listHiddenSkillGroups,
  listSkillGroups,
  resetSkills,
  restoreSkillGroup,
  saveSkillGroup,
} from './skills'

export {
  deletePost,
  getPostRecord,
  getPostWithBody,
  isPostOverridden,
  isSeedPost,
  listHiddenPostRecords,
  listPostRecords,
  resetPosts,
  restorePost,
  savePost,
  type SavePostInput,
} from './posts'

export {
  deleteProject,
  getProjectRecord,
  getProjectWithBody,
  isProjectOverridden,
  isSeedProject,
  listHiddenProjectRecords,
  listProjectRecords,
  resetProjects,
  restoreProject,
  saveProject,
  type SaveProjectInput,
} from './projects'

export { getSettings, isSettingsCustomized, resetSettings, saveSettings } from './settings'

export { getContentStats, type ContentStats } from './stats'

/**
 * 缓存失效订阅与记忆化。
 * 派生视图（`src/lib/content.ts`）需要同一套机制：`useSyncExternalStore` 要求
 * 快照函数返回稳定引用，而派生列表每次重算都会产生新数组。
 */
export { isStorageAvailable, memoize, subscribe } from './storage'

export { getRevision } from './storage'

export type {
  AdminSession,
  Post,
  PostRecord,
  Profile,
  Project,
  ProjectRecord,
  RecordMeta,
} from './types'

/** 所有可能被后台写入的内容键，供测试清理使用 */
export const CONTENT_STORE_NAMES = [
  'profile',
  'skills',
  'posts',
  'projects',
  'settings',
] as const

/** 把所有内容恢复为仓库里的种子状态（不涉及登录态） */
export function resetAllContent(): void {
  resetProfile()
  resetSkills()
  resetPosts()
  resetProjects()
  resetSettings()
  clearBodies()
}
