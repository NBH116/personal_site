import { invalidate, memoize, readJson, removeRaw, writeJson } from './storage'

/**
 * 通用集合仓储：种子数据 + localStorage 覆盖。
 *
 * 为什么用「覆盖 + 墓碑」而不是「首次访问把种子写进 localStorage」：
 * 后者的后果是种子一旦复制出去，`src/content` 与 `src/data` 里的改动就再也反映不到
 * 页面上了 —— 改一个错别字都要用户先去后台点一次「恢复默认」。
 * 覆盖式的语义是「localStorage 里只存用户真正改过的部分」，种子始终是活的。
 *
 * 由此带来的约束：Markdown 种子条目无法被真正删除，只能记一条墓碑把它隐藏。
 * 这是纯前端方案的固有限制（PRD 第六节：无数据库、无 CMS）。
 */

export interface OverrideState<T> {
  /** 被新增或改动的条目，key 为主键 */
  items: Record<string, T>
  /** 被隐藏的种子条目主键 */
  deleted: string[]
}

export interface KeyedCollection<T> {
  list(): T[]
  get(id: string): T | null
  save(item: T): void
  remove(id: string): void
  restore(id: string): void
  /** 是否被用户改动过（含新增），用于列表上标注「已修改」 */
  isOverridden(id: string): boolean
  /** 种子条目被隐藏的墓碑，用于提示与恢复 */
  deletedIds(): string[]
  reset(): void
}

interface KeyedCollectionOptions<T> {
  /** localStorage 键名与内存缓存前缀 */
  name: string
  keyOf: (item: T) => string
  seed: () => T[]
}

export function createKeyedCollection<T>(options: KeyedCollectionOptions<T>): KeyedCollection<T> {
  const { name, keyOf, seed } = options

  function readState(): OverrideState<T> {
    return readJson<OverrideState<T>>(name) ?? { items: {}, deleted: [] }
  }

  function list(): T[] {
    return memoize(`${name}:list`, () => {
      const state = readState()
      const hidden = new Set(state.deleted)
      const merged = new Map<string, T>()

      for (const item of seed()) {
        const id = keyOf(item)
        if (hidden.has(id)) continue
        merged.set(id, item)
      }

      // 覆盖项后写入，因此同名条目以 localStorage 的版本为准
      for (const item of Object.values(state.items)) {
        merged.set(keyOf(item), item)
      }

      return [...merged.values()]
    })
  }

  function get(id: string): T | null {
    return list().find((item) => keyOf(item) === id) ?? null
  }

  function save(item: T): void {
    const state = readState()
    const id = keyOf(item)

    state.items[id] = item
    // 重新保存等于取消隐藏，墓碑要一并清掉，否则种子条目会「刚存完又消失」
    state.deleted = state.deleted.filter((slug) => slug !== id)

    writeJson(name, state)
  }

  function remove(id: string): void {
    const state = readState()

    delete state.items[id]

    const isSeedItem = seed().some((item) => keyOf(item) === id)
    if (isSeedItem && !state.deleted.includes(id)) {
      state.deleted = [...state.deleted, id]
    }

    writeJson(name, state)
  }

  function restore(id: string): void {
    const state = readState()

    delete state.items[id]
    state.deleted = state.deleted.filter((slug) => slug !== id)

    writeJson(name, state)
  }

  return {
    list,
    get,
    save,
    remove,
    restore,
    isOverridden: (id) => Object.hasOwn(readState().items, id),
    deletedIds: () => readState().deleted,
    reset: () => removeRaw(name),
  }
}

export interface SingletonStore<T> {
  get(): T
  save(value: T): void
  reset(): void
  isCustomized(): boolean
}

interface SingletonOptions<T> {
  name: string
  seed: () => T
}

/**
 * 单例仓储（个人信息、站点设置）。
 * 读的时候与种子做浅合并，这样给种子新增字段时，用户已有的旧覆盖数据不会缺字段。
 */
export function createSingleton<T extends object>(options: SingletonOptions<T>): SingletonStore<T> {
  const { name, seed } = options

  function get(): T {
    return memoize(`${name}:value`, () => {
      const stored = readJson<Partial<T>>(name)
      if (!stored) return seed()
      return { ...seed(), ...stored }
    })
  }

  return {
    get,
    save: (value) => writeJson(name, value),
    reset: () => removeRaw(name),
    isCustomized: () => readJson<Partial<T>>(name) !== null,
  }
}

/** 清空全部覆盖数据，回到种子状态。仅供测试与「重置演示数据」使用。 */
export function resetCollections(names: string[]): void {
  for (const name of names) {
    try {
      removeRaw(name)
    } catch {
      // 忽略
    }
  }
  invalidate()
}
