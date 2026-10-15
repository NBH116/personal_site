/** 数组编辑的纯函数。抽出来是为了能脱离 React 单独测试（后台有四处列表编辑在用）。 */

/** 把 from 位置的元素移动到 to 位置。越界或原地不动时原样返回。 */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items
  }

  const next = [...items]
  const [moved] = next.splice(from, 1)
  if (moved === undefined) return items

  next.splice(to, 0, moved)
  return next
}

export function removeItem<T>(items: T[], index: number): T[] {
  if (index < 0 || index >= items.length) return items
  return items.filter((_, current) => current !== index)
}

export function replaceItem<T>(items: T[], index: number, value: T): T[] {
  if (index < 0 || index >= items.length) return items
  return items.map((item, current) => (current === index ? value : item))
}

/** 追加到末尾。刻意不复用 push，避免调用方拿到被改动的原数组。 */
export function appendItem<T>(items: T[], value: T): T[] {
  return [...items, value]
}
