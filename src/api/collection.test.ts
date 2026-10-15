import { afterEach, describe, expect, it } from 'vitest'

import { createKeyedCollection, createSingleton, resetCollections } from './collection'
import { writeJson } from './storage'

const NAMES = ['test-collection', 'test-singleton'] as const

interface Item {
  id: string
  label: string
}

const SEED: Item[] = [
  { id: 'a', label: '种子 A' },
  { id: 'b', label: '种子 B' },
]

function makeCollection(name: string) {
  return createKeyedCollection<Item>({
    name,
    keyOf: (item) => item.id,
    seed: () => SEED,
  })
}

afterEach(() => {
  resetCollections([...NAMES])
})

describe('createKeyedCollection', () => {
  it('没有覆盖数据时等于种子', () => {
    const store = makeCollection(NAMES[0])
    expect(store.list().map((item) => item.id)).toEqual(['a', 'b'])
  })

  it('保存同名条目会覆盖种子的版本', () => {
    const store = makeCollection(NAMES[0])
    store.save({ id: 'a', label: '改过的 A' })

    expect(store.get('a')?.label).toBe('改过的 A')
    expect(store.list()).toHaveLength(2)
    expect(store.isOverridden('a')).toBe(true)
    expect(store.isOverridden('b')).toBe(false)
  })

  it('保存新条目会追加到列表末尾', () => {
    const store = makeCollection(NAMES[0])
    store.save({ id: 'c', label: '新增 C' })

    expect(store.list().map((item) => item.id)).toEqual(['a', 'b', 'c'])
    expect(store.isOverridden('c')).toBe(true)
  })

  it('删除种子条目记为墓碑，条目从列表消失但可恢复', () => {
    const store = makeCollection(NAMES[0])
    store.remove('a')

    expect(store.list().map((item) => item.id)).toEqual(['b'])
    expect(store.deletedIds()).toEqual(['a'])

    store.restore('a')

    expect(store.list().map((item) => item.id)).toEqual(['a', 'b'])
    expect(store.deletedIds()).toEqual([])
  })

  it('删除非种子条目是彻底删除，不会留下墓碑', () => {
    const store = makeCollection(NAMES[0])
    store.save({ id: 'c', label: '新增 C' })
    store.remove('c')

    expect(store.list().map((item) => item.id)).toEqual(['a', 'b'])
    expect(store.deletedIds()).toEqual([])
  })

  it('重新保存被隐藏的种子条目会同时取消隐藏', () => {
    const store = makeCollection(NAMES[0])
    store.remove('a')
    store.save({ id: 'a', label: '改过的 A' })

    // 不清墓碑的话，条目会「刚存完又消失」
    expect(store.deletedIds()).toEqual([])
    expect(store.get('a')?.label).toBe('改过的 A')
  })

  it('reset 后回到种子状态', () => {
    const store = makeCollection(NAMES[0])
    store.save({ id: 'c', label: '新增 C' })
    store.remove('a')
    store.reset()

    expect(store.list().map((item) => item.id)).toEqual(['a', 'b'])
    expect(store.deletedIds()).toEqual([])
  })

  it('list 返回稳定引用，供 useSyncExternalStore 当快照使用', () => {
    const store = makeCollection(NAMES[0])

    // 每次返回新数组会让 React 判定「快照一直在变」而抛无限循环
    expect(store.list()).toBe(store.list())

    store.save({ id: 'c', label: '新增 C' })

    expect(store.list()).toBe(store.list())
  })

  it('写入会使缓存失效，快照随之变化', () => {
    const store = makeCollection(NAMES[0])
    const before = store.list()

    store.save({ id: 'c', label: '新增 C' })

    expect(store.list()).not.toBe(before)
    expect(store.list()).toHaveLength(3)
  })
})

describe('createSingleton', () => {
  interface Config {
    title: string
    count: number
  }

  const SEED_CONFIG: Config = { title: '默认标题', count: 3 }

  function makeSingleton(name: string) {
    return createSingleton<Config>({ name, seed: () => ({ ...SEED_CONFIG }) })
  }

  it('没有覆盖数据时返回种子', () => {
    const store = makeSingleton(NAMES[1])

    expect(store.get()).toEqual(SEED_CONFIG)
    expect(store.isCustomized()).toBe(false)
  })

  it('保存后返回保存的值，并标记为已自定义', () => {
    const store = makeSingleton(NAMES[1])
    store.save({ title: '改过的标题', count: 5 })

    expect(store.get()).toEqual({ title: '改过的标题', count: 5 })
    expect(store.isCustomized()).toBe(true)
  })

  it('种子里新增的字段不会被旧覆盖数据弄丢', () => {
    // 直接写一份「只有部分字段」的存储内容，模拟旧版本留下的数据
    writeJson(NAMES[1], { title: '改过的标题' })

    const store = makeSingleton(NAMES[1])
    const value = store.get()

    expect(value.title).toBe('改过的标题')
    expect(value.count).toBe(SEED_CONFIG.count)
  })

  it('reset 后回到种子', () => {
    const store = makeSingleton(NAMES[1])
    store.save({ title: '改过的标题', count: 5 })
    store.reset()

    expect(store.get()).toEqual(SEED_CONFIG)
    expect(store.isCustomized()).toBe(false)
  })

  it('get 返回稳定引用', () => {
    const store = makeSingleton(NAMES[1])
    expect(store.get()).toBe(store.get())
  })
})
