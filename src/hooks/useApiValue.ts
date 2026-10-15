import { useSyncExternalStore } from 'react'

import { getRevision, subscribe } from '@/api'

/**
 * 把 `src/api` 的读取函数接到 React 上。
 *
 * 为什么不用 `useState` + `useEffect`：数据源是 localStorage，写入发生在别处
 * （后台表单、另一个标签页），订阅回调是唯一能及时触发重渲染的信号。
 * `useSyncExternalStore` 正好是这个模型，且不会有 effect 时序导致的闪一帧。
 *
 * 传入的 `read` 必须是幂等且**返回稳定引用**的（`src/api` 与 `src/lib/content.ts`
 * 都用 `memoize` 保证这一点），否则 React 会判定快照一直在变而抛出无限循环。
 */
export function useApiValue<T>(read: () => T): T {
  return useSyncExternalStore(subscribe, read, read)
}

/**
 * 当前数据版本号。写入任何内容都会自增。
 *
 * 给「按 slug 异步取一篇正文」这类读取用的：它们的结果无法用 `memoize` 表达成
 * 稳定快照，只能把版本号放进 effect 依赖里，改一次就重新取一次。
 */
export function useApiRevision(): number {
  return useSyncExternalStore(subscribe, getRevision, getRevision)
}
