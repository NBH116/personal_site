import GithubSlugger from 'github-slugger'

import type { TocItem } from '../schemas/content'

/**
 * 从 Markdown 正文抽取二到四级标题，供目录（TOC）使用。
 *
 * 这个函数被两侧共用，这是刻意的：
 * - 构建期：`vite.config.ts` 的 markdown 插件用它生成 `?meta` 里的 headings；
 * - 运行期：后台新建/编辑的文章没有构建期产物，只能在渲染时现算。
 *
 * 如果两侧各写一份，标题清洗规则迟早会分叉，表现就是「目录点不到」——AGENTS.md
 * 第七节点名的易错点。共用一份实现让这个风险从「需要人工同步」变成「结构上不可能」。
 *
 * 注意：这里用 `github-slugger`，`rehype-slug` 内部用的也是同一个包，
 * 因此生成的 id 与正文渲染结果天然一致。
 *
 * 导入路径刻意用相对路径而不是 `@/` 别名：本文件会被 `vite.config.ts` 在 Node 侧
 * 导入，那里没有配置路径别名。
 */
export function extractHeadings(markdown: string): TocItem[] {
  const slugger = new GithubSlugger()
  const headings: TocItem[] = []
  let inFence = false

  for (const line of markdown.split('\n')) {
    // 代码块里的 `# 注释` 不是标题，必须跳过
    if (line.trimStart().startsWith('```')) {
      inFence = !inFence
      continue
    }
    if (inFence) continue

    const matched = /^(#{2,4})\s+(.+?)\s*$/.exec(line)
    if (!matched) continue

    const depth = matched[1]?.length ?? 2
    const text = (matched[2] ?? '').replace(/[`*_]/g, '')

    headings.push({ depth, text, id: slugger.slug(text) })
  }

  return headings
}
