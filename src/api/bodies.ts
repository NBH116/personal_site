import { invalidate, isStorageAvailable, readRaw, removeRaw, storageKey, writeRaw } from './storage'

/**
 * Markdown 正文的独立存储。
 *
 * 为什么正文不跟条目放在一起：文章正文动辄几十 KB，如果和列表存在同一个 JSON 里，
 * 每次保存一篇都要把全部正文重新序列化一遍。按 slug 分键之后，一次写入只影响一个键。
 */

export type ContentKind = 'post' | 'project'

export const BODY_KEY_PREFIX = 'body-'

function bodyKey(kind: ContentKind, slug: string): string {
  return `${BODY_KEY_PREFIX}${kind}-${slug}`
}

export function readBody(kind: ContentKind, slug: string): string | null {
  return readRaw(bodyKey(kind, slug))
}

export function writeBody(kind: ContentKind, slug: string, body: string): void {
  writeRaw(bodyKey(kind, slug), body)
}

export function removeBody(kind: ContentKind, slug: string): void {
  removeRaw(bodyKey(kind, slug))
}

/**
 * 清空全部正文覆盖。
 * localStorage 没有按前缀删除的 API，只能遍历收集后再删（收集与删除必须分两步，
 * 否则删除会改变索引导致漏删）。
 */
export function clearBodies(): void {
  const prefix = storageKey(BODY_KEY_PREFIX)
  const doomed: string[] = []

  try {
    if (!isStorageAvailable()) return

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index)
      if (key?.startsWith(prefix)) doomed.push(key)
    }

    for (const key of doomed) {
      window.localStorage.removeItem(key)
    }
  } catch {
    // 存储不可用或读键抛错时无可清理内容
  }

  invalidate()
}
