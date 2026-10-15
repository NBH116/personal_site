import type { AccentKey } from '@/data/settings'

import { getProfile, isProfileCustomized } from './profile'
import { listHiddenPostRecords, listPostRecords } from './posts'
import { listHiddenProjectRecords, listProjectRecords } from './projects'
import { getSettings, isSettingsCustomized } from './settings'
import { listHiddenSkillGroups, listSkillGroups } from './skills'
import { memoize } from './storage'

/**
 * 仪表盘的内容统计。
 *
 * 放在数据层而不是页面里：这些数字全部来自集合仓储，页面自己拼会重复实现
 * 「隐藏条目算不算」「草稿算不算」这类口径，口径一散就没法核对。
 */

export interface ContentStats {
  posts: {
    total: number
    published: number
    drafts: number
    /** 被隐藏（删除）的种子文章数 */
    hidden: number
    tags: number
  }
  projects: {
    total: number
    active: number
    wip: number
    archived: number
    featured: number
    hidden: number
    tags: number
  }
  skills: {
    groups: number
    items: number
    hidden: number
  }
  profile: {
    customized: boolean
    experience: number
    awards: number
    socials: number
  }
  settings: {
    customized: boolean
    accent: AccentKey
    starfieldEnabled: boolean
  }
}

function countTags(records: { frontmatter: { tags?: string[] } }[]): number {
  return new Set(records.flatMap((record) => record.frontmatter.tags ?? [])).size
}

export function getContentStats(): ContentStats {
  // 必须经过 memoize：仪表盘用 useSyncExternalStore 订阅它，
  // 每次调用都返回新对象会被 React 判成「快照一直在变」而抛无限循环
  return memoize('stats:summary', computeStats)
}

function computeStats(): ContentStats {
  const posts = listPostRecords()
  const projects = listProjectRecords()
  const skillGroups = listSkillGroups()
  const profile = getProfile()
  const settings = getSettings()

  return {
    posts: {
      total: posts.length,
      published: posts.filter((post) => !post.frontmatter.draft).length,
      drafts: posts.filter((post) => post.frontmatter.draft).length,
      hidden: listHiddenPostRecords().length,
      tags: countTags(posts),
    },
    projects: {
      total: projects.length,
      active: projects.filter((project) => project.frontmatter.status === 'active').length,
      wip: projects.filter((project) => project.frontmatter.status === 'wip').length,
      archived: projects.filter((project) => project.frontmatter.status === 'archived').length,
      featured: projects.filter((project) => project.frontmatter.featured).length,
      hidden: listHiddenProjectRecords().length,
      tags: countTags(projects),
    },
    skills: {
      groups: skillGroups.length,
      items: skillGroups.reduce((sum, group) => sum + group.items.length, 0),
      hidden: listHiddenSkillGroups().length,
    },
    profile: {
      customized: isProfileCustomized(),
      experience: profile.experience.length,
      awards: profile.awards.reduce((sum, group) => sum + group.items.length, 0),
      socials: profile.socials.length,
    },
    settings: {
      customized: isSettingsCustomized(),
      accent: settings.accent,
      starfieldEnabled: settings.starfieldEnabled,
    },
  }
}
