import { describe, expect, it } from 'vitest'

import { findActiveHeading, toToc, type TocItem } from './toc'

const headings: TocItem[] = [
  { id: 'intro', text: '引言', depth: 2 },
  { id: 'detail', text: '细节', depth: 3 },
  { id: 'too-deep', text: '过深的标题', depth: 4 },
  { id: 'h1-like', text: '一级标题', depth: 1 },
  { id: 'summary', text: '总结', depth: 2 },
]

describe('toToc', () => {
  it('只保留二级到三级标题', () => {
    expect(toToc(headings).map((item) => item.id)).toEqual(['intro', 'detail', 'summary'])
  })

  it('maxDepth 可收紧到二级', () => {
    expect(toToc(headings, 2).map((item) => item.id)).toEqual(['intro', 'summary'])
  })

  it('空数组返回空数组', () => {
    expect(toToc([])).toEqual([])
  })
})

describe('findActiveHeading', () => {
  const ids = ['a', 'b', 'c']
  const offsets: Record<string, number> = { a: 100, b: 300, c: 800 }
  const offsetTop = (id: string) => offsets[id] ?? 0

  it('取最后一个已越过参考线的标题', () => {
    expect(findActiveHeading(ids, offsetTop, 350)).toBe('b')
  })

  it('标题刚滚出视口时仍保持高亮', () => {
    expect(findActiveHeading(ids, offsetTop, 900)).toBe('c')
  })

  it('尚未越过任何标题时高亮第一个', () => {
    expect(findActiveHeading(ids, offsetTop, 50)).toBe('a')
  })

  it('没有标题时返回 null', () => {
    expect(findActiveHeading([], offsetTop, 100)).toBeNull()
  })
})
