import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import matter from 'gray-matter'
import { blogFrontmatterSchema, projectFrontmatterSchema } from './src/schemas/content'
import { extractHeadings } from './src/lib/headings'
import { estimateReadingTime } from './src/lib/reading-time'

/**
 * 把 src/content 下的 Markdown 转换成 JS 模块。
 *
 * - 默认导入：导出 frontmatter、headings 与 body（正文）
 * - 带 `?meta` 查询：只导出 frontmatter 与 headings，不带正文
 *
 * 列表页用 `?meta` 只加载元数据，详情页才懒加载正文，
 * 否则所有文章正文会被打进列表页的包。
 *
 * 标题抽取复用 `src/lib/headings.ts`，与运行期（后台新建的文章）用的是同一份实现，
 * 保证构建期与运行期生成的目录锚点 id 一致。
 */
function markdownContent(): Plugin {
  const CONTENT_DIR = '/src/content/'

  return {
    name: 'markdown-content',
    transform(code, id) {
      const [file, query = ''] = id.split('?')
      if (!file?.endsWith('.md')) return
      if (!file.includes(CONTENT_DIR)) return

      const isMetaOnly = query.includes('meta')
      const isProject = file.includes(`${CONTENT_DIR}projects/`)
      const slug = (file.split('/').pop() ?? '').replace(/\.md$/, '')
      const { data, content } = matter(code)
      const frontmatter = isProject
        ? projectFrontmatterSchema.parse(data)
        : blogFrontmatterSchema.parse(data)
      const headings = extractHeadings(content)

      // 阅读时长在构建期算好：列表页只加载 ?meta，拿不到正文。
      // 只有博客的 frontmatter 允许手写 readingTime 覆盖自动估算。
      let readingTime = estimateReadingTime(content)
      if ('readingTime' in frontmatter && typeof frontmatter.readingTime === 'number') {
        readingTime = frontmatter.readingTime
      }

      const parts = [
        `export const slug = ${JSON.stringify(slug)};`,
        `export const frontmatter = ${JSON.stringify(frontmatter)};`,
        `export const headings = ${JSON.stringify(headings)};`,
        `export const readingTime = ${JSON.stringify(readingTime)};`,
      ]

      if (!isMetaOnly) {
        parts.push(`export const body = ${JSON.stringify(content)};`)
      }

      const keys = isMetaOnly
        ? 'slug, frontmatter, headings, readingTime'
        : 'slug, frontmatter, headings, readingTime, body'
      parts.push(`export default { ${keys} };`)

      return { code: parts.join('\n'), map: null }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), markdownContent()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
