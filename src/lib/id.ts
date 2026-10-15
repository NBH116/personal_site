/**
 * 生成重复项（经历要点、新条目等）的稳定 id。
 *
 * 为什么需要它：React 列表要求稳定 key（AGENTS.md 4），而用户手填的名称可以重复，
 * 用名称当 key 会在重命名时整列表重挂载。所以新增一条就发一个 id，存进数据里。
 */
export function createId(prefix = 'item'): string {
  const bytes = new Uint8Array(8)

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes)
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256)
    }
  }

  const random = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${prefix}-${Date.now().toString(36)}-${random}`
}
