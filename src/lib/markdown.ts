import type { Options } from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'

import bash from 'highlight.js/lib/languages/bash'
import c from 'highlight.js/lib/languages/c'
import cpp from 'highlight.js/lib/languages/cpp'
import css from 'highlight.js/lib/languages/css'
import diff from 'highlight.js/lib/languages/diff'
import ini from 'highlight.js/lib/languages/ini'
import java from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import kotlin from 'highlight.js/lib/languages/kotlin'
import markdown from 'highlight.js/lib/languages/markdown'
import python from 'highlight.js/lib/languages/python'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'

/**
 * 只注册实际会用到的语言。
 * highlight.js 全量引入体积很大，注册常用集能把高亮器控制在合理范围内。
 */
const languages = {
  bash,
  c,
  cpp,
  css,
  diff,
  ini,
  java,
  javascript,
  json,
  kotlin,
  markdown,
  python,
  sql,
  typescript,
  xml,
  yaml,
}

export const remarkPlugins: NonNullable<Options['remarkPlugins']> = [remarkGfm]

export const rehypePlugins: NonNullable<Options['rehypePlugins']> = [
  // 生成的标题 id 必须与构建期 github-slugger 的输出一致，否则 TOC 锚点点不到
  rehypeSlug,
  [
    rehypeHighlight,
    {
      // 不做自动语言探测：探测会让每个代码块都被完整解析一遍，代价高且结果不稳定
      detect: false,
      languages,
    },
  ],
]
