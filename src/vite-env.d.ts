/// <reference types="vite/client" />

declare module '*.md' {
  const mod: {
    slug: string
    frontmatter: Record<string, unknown>
    headings: { id: string; text: string; depth: number }[]
    body?: string
  }
  export default mod
  export const slug: string
  export const frontmatter: Record<string, unknown>
  export const headings: { id: string; text: string; depth: number }[]
  export const body: string
}

/**
 * 后台凭据走环境变量而不是写死在代码里。
 * 两者都没有类型时会被推断为 `any`，显式声明成 `string | undefined`
 * 才能在 `src/api/auth.ts` 里安全地做「未配置就回退默认值」的判断。
 *
 * 再次提醒：Vite 会把这两个值内联进客户端产物，它们不是秘密（见 auth.ts 的说明）。
 */
interface ImportMetaEnv {
  readonly VITE_ADMIN_USERNAME?: string
  readonly VITE_ADMIN_PASSWORD?: string
}
