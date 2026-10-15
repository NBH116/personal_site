const CJK_PATTERN = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/g

/**
 * 按中英文字数估算阅读时长（分钟）。
 * 纯字符串运算，刻意不依赖任何 Node API —— 它会被构建期插件与服务端共用。
 */
export function estimateReadingTime(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!?\[[^\]]*\]\([^)]*\)/g, ' ')

  const cjkCount = (text.match(CJK_PATTERN) ?? []).length
  const latinWords = (text.replace(CJK_PATTERN, ' ').match(/[A-Za-z0-9]+/g) ?? []).length

  // 中文约 350 字/分钟，英文约 200 词/分钟
  const minutes = cjkCount / 350 + latinWords / 200

  return Math.max(1, Math.round(minutes))
}
