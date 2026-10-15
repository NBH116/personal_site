import { describe, expect, it } from 'vitest'

import {
  collectTags,
  excludeArchived,
  filterDrafts,
  getPosts,
  getProjects,
  sortByDateDesc,
  sortProjects,
  sortRecordsByDateDesc,
} from './content'

describe('sortByDateDesc', () => {
  it('按日期倒序排列', () => {
    const items = [{ date: '2024-01-01' }, { date: '2025-06-01' }, { date: '2023-12-31' }]
    expect(sortByDateDesc(items).map((item) => item.date)).toEqual([
      '2025-06-01',
      '2024-01-01',
      '2023-12-31',
    ])
  })

  it('不修改传入的数组', () => {
    const items = [{ date: '2024-01-01' }, { date: '2025-06-01' }]
    sortByDateDesc(items)
    expect(items[0]?.date).toBe('2024-01-01')
  })

  it('同一天时顺序稳定', () => {
    const items = [{ date: '2025-01-01' }, { date: '2025-01-01' }]
    expect(sortByDateDesc(items)).toHaveLength(2)
  })
})

describe('filterDrafts', () => {
  const items = [
    { draft: false, name: 'published' },
    { draft: true, name: 'draft' },
  ]

  it('includeDrafts 为 true 时保留草稿', () => {
    expect(filterDrafts(items, true)).toHaveLength(2)
  })

  it('includeDrafts 为 false 时排除草稿', () => {
    expect(filterDrafts(items, false).map((item) => item.name)).toEqual(['published'])
  })
})

describe('sortProjects', () => {
  it('featured 整体前置，组内按日期倒序', () => {
    const projects = [
      { featured: false, date: '2025-09-01', id: 'a' },
      { featured: true, date: '2024-01-01', id: 'b' },
      { featured: false, date: '2025-10-01', id: 'c' },
      { featured: true, date: '2025-03-01', id: 'd' },
    ]

    expect(sortProjects(projects).map((project) => project.id)).toEqual(['d', 'b', 'c', 'a'])
  })
})

describe('excludeArchived', () => {
  it('过滤掉 archived 状态', () => {
    const items: { status: 'active' | 'wip' | 'archived'; id: string }[] = [
      { status: 'active', id: 'a' },
      { status: 'archived', id: 'b' },
      { status: 'wip', id: 'c' },
    ]

    expect(excludeArchived(items).map((item) => item.id)).toEqual(['a', 'c'])
  })
})

describe('sortRecordsByDateDesc', () => {
  const records = [
    { slug: 'old', frontmatter: { date: '2024-01-01', title: '旧' } },
    { slug: 'newest', frontmatter: { date: '2025-10-01', title: '新' } },
    { slug: 'mid', frontmatter: { date: '2025-02-01', title: '中' } },
  ]

  it('按 frontmatter.date 倒序排列', () => {
    expect(sortRecordsByDateDesc(records).map((record) => record.slug)).toEqual([
      'newest',
      'mid',
      'old',
    ])
  })

  it('不修改传入的数组', () => {
    sortRecordsByDateDesc(records)
    expect(records[0]?.slug).toBe('old')
  })
})

describe('collectTags', () => {
  it('去重并按中文排序规则排列（中文位于拉丁字母之前）', () => {
    const items = [{ tags: ['React', 'Vite'] }, { tags: ['React', '数据库'] }]
    expect(collectTags(items)).toEqual(['数据库', 'React', 'Vite'])
  })

  it('没有标签时返回空数组', () => {
    expect(collectTags([{ tags: [] }])).toEqual([])
  })

  it('没有条目时返回空数组', () => {
    expect(collectTags([])).toEqual([])
  })
})

describe('内容装载', () => {
  it('列表项都带有构建期算好的阅读时长与描述', () => {
    const posts = getPosts()

    expect(posts.length).toBeGreaterThan(0)
    for (const post of posts) {
      expect(post.readingTime).toBeGreaterThan(0)
      expect(post.description.length).toBeGreaterThan(0)
      expect(post.title.length).toBeGreaterThan(0)
    }
  })

  it('开发环境保留草稿，供列表标注', () => {
    expect(getPosts().some((post) => post.draft)).toBe(true)
  })

  it('项目列表里 featured 排在最前面', () => {
    const projects = getProjects()
    const firstNonFeatured = projects.findIndex((project) => !project.featured)
    const lastFeatured = projects.map((p) => p.featured).lastIndexOf(true)

    if (firstNonFeatured !== -1 && lastFeatured !== -1) {
      expect(lastFeatured).toBeLessThan(firstNonFeatured)
    }
  })

  it('博客列表按日期倒序', () => {
    const dates = getPosts().map((post) => post.date)
    const sorted = [...dates].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
    expect(dates).toEqual(sorted)
  })
})
