/**
 * 站点设置的静态默认值与强调色预设。
 *
 * 色值集中放在数据文件里而不是组件里：PRD 4.1 要求强调色可通过 CSS 变量整体替换，
 * 组件只负责把选中的预设写到根节点变量上，不出现硬编码色值。
 */

export type AccentKey = 'sky' | 'violet' | 'aurora'

export interface AccentPreset {
  key: AccentKey
  label: string
  accent: string
  /** 悬停/按下时深一档的强调色 */
  accentStrong: string
  /** 强调色浅底，标签与悬停底色使用 */
  accentSoft: string
}

/** 与 PRD 4.1 的「预置三套候选」一致 */
export const accentPresets: AccentPreset[] = [
  {
    key: 'sky',
    label: '星蓝',
    accent: '#7dd3fc',
    accentStrong: '#38bdf8',
    accentSoft: 'rgb(125 211 252 / 0.12)',
  },
  {
    key: 'violet',
    label: '星紫',
    accent: '#a78bfa',
    accentStrong: '#8b5cf6',
    accentSoft: 'rgb(167 139 250 / 0.12)',
  },
  {
    key: 'aurora',
    label: '极光青',
    accent: '#5eead4',
    accentStrong: '#2dd4bf',
    accentSoft: 'rgb(94 234 212 / 0.12)',
  },
]

export function findAccentPreset(key: AccentKey): AccentPreset {
  return accentPresets.find((preset) => preset.key === key) ?? accentPresets[0]!
}

export interface SiteSettings {
  /** 浏览器标题后缀，形如「关于 | <siteTitle>」 */
  siteTitle: string
  /** index.html 的 meta description 与分享摘要 */
  siteDescription: string
  accent: AccentKey
  /** 关闭后前台不挂载 Canvas 星空（性能或偏好原因） */
  starfieldEnabled: boolean
  /** 首页项目区块展示的条数 */
  homeProjectCount: number
  /** 首页博客区块展示的条数 */
  homePostCount: number
  footerNote: string
}

export const defaultSettings: SiteSettings = {
  siteTitle: '个人主页',
  siteDescription: '个人主页：项目经历、技术博客与联系方式。',
  accent: 'sky',
  starfieldEnabled: true,
  homeProjectCount: 3,
  homePostCount: 3,
  footerNote: '',
}
