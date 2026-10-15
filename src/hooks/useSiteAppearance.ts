import { useEffect } from 'react'

import { findAccentPreset } from '@/data/settings'

import { useSettings } from './useSettings'

/**
 * 把站点设置里的视觉项写回 DOM。
 *
 * 为什么是「写 CSS 变量」而不是把令牌值传进组件：强调色在 `global.css` 的 `@theme`
 * 里已经有一份默认值，组件用的都是令牌派生类。这里只覆盖根节点上的变量，
 * 组件一行都不用改（TECH_DESIGN 5.7 留的就是这个入口）。
 *
 * 前台（`App`）与后台（`AdminLayout`）都调用它，这样两边主题始终一致；
 * 卸载时移除内联变量，回落到 `@theme` 的默认值。
 */
export function useSiteAppearance(): void {
  const settings = useSettings()
  const { accent, siteDescription } = settings

  useEffect(() => {
    const preset = findAccentPreset(accent)
    const root = document.documentElement

    root.style.setProperty('--accent', preset.accent)
    root.style.setProperty('--color-accent', preset.accent)
    root.style.setProperty('--color-accent-strong', preset.accentStrong)
    root.style.setProperty('--color-accent-soft', preset.accentSoft)

    return () => {
      root.style.removeProperty('--accent')
      root.style.removeProperty('--color-accent')
      root.style.removeProperty('--color-accent-strong')
      root.style.removeProperty('--color-accent-soft')
    }
  }, [accent])

  useEffect(() => {
    // 纯客户端渲染只能运行时补 meta description（index.html 里那份是构建期默认值）
    document.querySelector('meta[name="description"]')?.setAttribute('content', siteDescription)
  }, [siteDescription])
}
