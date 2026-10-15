import { useEffect } from 'react'

import { useSettings } from './useSettings'

/**
 * 纯客户端渲染下没有服务端拼 meta 的机会，
 * 运行时同步标题是当前方案能给到的最低成本补偿（PRD 第六节已知限制）。
 * 后缀取站点设置里的 siteTitle，与页脚、Logo 保持一致。
 */
export function useDocumentTitle(title?: string) {
  const { siteTitle } = useSettings()

  useEffect(() => {
    const previous = document.title
    document.title = title ? `${title} | ${siteTitle}` : siteTitle

    return () => {
      document.title = previous
    }
  }, [title, siteTitle])
}
