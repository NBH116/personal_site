export interface TocItem {
  id: string
  text: string
  depth: number
}

/**
 * 目录只展示二级到三级标题。
 * 四级标题在文章里通常过于细碎，放进目录会让侧栏失去可读性。
 */
export function toToc(headings: TocItem[], maxDepth = 3): TocItem[] {
  return headings.filter((heading) => heading.depth >= 2 && heading.depth <= maxDepth)
}

/**
 * 取当前滚动位置下应该高亮的目录项。
 *
 * 做法是在所有已越过「顶部参考线」的标题中取最后一个：
 * 这比「取第一个可见标题」更贴近阅读直觉，也让标题刚滚出视口时仍保持高亮。
 */
export function findActiveHeading(ids: string[], offsetTop: (id: string) => number, lineY: number) {
  let active: string | null = null

  for (const id of ids) {
    if (offsetTop(id) - lineY <= 0) {
      active = id
    } else {
      break
    }
  }

  // 尚未越过任何标题时，默认高亮第一个，避免目录整体无高亮
  return active ?? ids[0] ?? null
}
