import { Children, isValidElement, type ReactNode } from 'react'
import Markdown from 'react-markdown'

import { rehypePlugins, remarkPlugins } from '@/lib/markdown'

import { CodeBlock } from './CodeBlock'

/** 把渲染树里的文本拼回来，用于「复制代码」——高亮后文本被拆成了多个 span */
function extractText(node: ReactNode): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) return extractText(node.props.children)
  return ''
}

function PreBlock({ children }: { children?: ReactNode }) {
  const [firstChild] = Children.toArray(children)
  const className = isValidElement<{ className?: string }>(firstChild)
    ? firstChild.props.className
    : undefined
  const language = /language-([\w-]+)/.exec(className ?? '')?.[1] ?? ''
  const code = extractText(children).replace(/\n$/, '')

  return (
    <CodeBlock language={language} code={code}>
      {children}
    </CodeBlock>
  )
}

const components = {
  pre: PreBlock,
  a: ({ children, href }: { children?: ReactNode; href?: string }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  img: ({ src, alt }: { src?: string; alt?: string }) => (
    <img src={src} alt={alt ?? ''} loading="lazy" decoding="async" />
  ),
}

interface MarkdownRendererProps {
  content: string
}

/**
 * 这个组件被 React.lazy 引入，解析器与高亮器只进入文章详情页的分包，
 * 首页与列表页不会加载它们（TECH_DESIGN 5.5）。
 */
export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose-custom">
      <Markdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins} components={components}>
        {content}
      </Markdown>
    </div>
  )
}
