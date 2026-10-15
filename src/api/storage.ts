/**
 * localStorage 读写封装与变更通知。
 *
 * 为什么需要版本号与订阅：本项目的后台改动写进 localStorage，前台页面在同一个
 * 标签页里读同一份数据。写完之后如果不通知订阅者，已挂载的页面不会重新渲染。
 * 所以每次写入都自增一个 revision，并用 `useSyncExternalStore` 订阅它。
 *
 * 所有写入都会清空内存缓存 —— 缓存存在的意义只是让快照函数返回稳定引用
 * （`useSyncExternalStore` 要求 getSnapshot 是幂等的），而不是为了少读一次
 * localStorage。
 */

const PREFIX = 'personal-site:v1:'

export function storageKey(name: string): string {
  return `${PREFIX}${name}`
}

/**
 * 隐私模式或禁用存储时访问 localStorage 会抛错，所以每一次访问都要兜住。
 * 读不到时整个后台退化为「只读种子数据」，页面不该因此白屏。
 */
function storage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage
  } catch {
    return null
  }
}

export function isStorageAvailable(): boolean {
  const store = storage()
  if (!store) return false

  try {
    const probe = storageKey('__probe__')
    store.setItem(probe, '1')
    store.removeItem(probe)
    return true
  } catch {
    return false
  }
}

export function readRaw(name: string): string | null {
  try {
    return storage()?.getItem(storageKey(name)) ?? null
  } catch {
    return null
  }
}

export function writeRaw(name: string, value: string): void {
  try {
    storage()?.setItem(storageKey(name), value)
    invalidate()
  } catch {
    // 配额写满或被拒绝：写不进去不该让后台崩掉，用户下次操作会再次失败
  }
}

export function removeRaw(name: string): void {
  try {
    storage()?.removeItem(storageKey(name))
    invalidate()
  } catch {
    // 同上
  }
}

/** 解析失败的旧数据按「没有数据」处理，走种子回退，而不是抛错中断渲染 */
export function readJson<T>(name: string): T | null {
  const raw = readRaw(name)
  if (raw === null) return null

  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function writeJson(name: string, value: unknown): void {
  try {
    writeRaw(name, JSON.stringify(value))
  } catch {
    // JSON.stringify 失败（循环引用等）属于编程错误，这里只保证不把异常抛给 UI
  }
}

/* ------------------------------------------------------------------
   变更通知
   ------------------------------------------------------------------ */

let revision = 0
const listeners = new Set<() => void>()
const memo = new Map<string, unknown>()

export function getRevision(): number {
  return revision
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** 清缓存并通知所有订阅者重新读取 */
export function invalidate(): void {
  memo.clear()
  revision += 1
  for (const listener of listeners) {
    listener()
  }
}

/**
 * 让快照函数返回稳定引用。
 * 注意用 `has` 判断而不是 `!== undefined`，否则值为 undefined 的键会被反复重算。
 */
export function memoize<T>(key: string, compute: () => T): T {
  if (memo.has(key)) return memo.get(key) as T

  const value = compute()
  memo.set(key, value)
  return value
}

/** 仅测试与「恢复默认」使用 */
export function clearAll(names: string[]): void {
  for (const name of names) {
    try {
      storage()?.removeItem(storageKey(name))
    } catch {
      // 忽略
    }
  }
  invalidate()
}
