import { describe, expect, it } from 'vitest'

import { appendItem, moveItem, removeItem, replaceItem } from './list'

describe('moveItem', () => {
  const items = ['a', 'b', 'c']

  it('把元素移到目标位置，其余项依次让位', () => {
    expect(moveItem(items, 0, 2)).toEqual(['b', 'c', 'a'])
    expect(moveItem(items, 2, 0)).toEqual(['c', 'a', 'b'])
  })

  it('原地移动返回原数组的引用，避免无意义的重渲染', () => {
    expect(moveItem(items, 1, 1)).toBe(items)
  })

  it('越界时返回原数组', () => {
    expect(moveItem(items, -1, 0)).toBe(items)
    expect(moveItem(items, 0, 3)).toBe(items)

    const empty: string[] = []
    expect(moveItem(empty, 0, 0)).toBe(empty)
  })

  it('不修改传入的数组', () => {
    const source = ['a', 'b', 'c']
    moveItem(source, 0, 2)
    expect(source).toEqual(['a', 'b', 'c'])
  })
})

describe('removeItem', () => {
  it('按下标移除', () => {
    expect(removeItem(['a', 'b', 'c'], 1)).toEqual(['a', 'c'])
  })

  it('越界时返回原数组', () => {
    const items = ['a']
    expect(removeItem(items, 5)).toBe(items)
    expect(removeItem(items, -1)).toBe(items)
  })
})

describe('replaceItem', () => {
  it('只替换目标下标', () => {
    expect(replaceItem(['a', 'b', 'c'], 1, 'x')).toEqual(['a', 'x', 'c'])
  })

  it('越界时返回原数组', () => {
    const items = ['a']
    expect(replaceItem(items, 3, 'x')).toBe(items)
  })
})

describe('appendItem', () => {
  it('追加到末尾且不修改原数组', () => {
    const items = ['a']
    const next = appendItem(items, 'b')

    expect(next).toEqual(['a', 'b'])
    expect(items).toEqual(['a'])
  })
})
