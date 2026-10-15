export type SkillLevel = 1 | 2 | 3 | 4 | 5

export interface SkillItem {
  name: string
  level: SkillLevel
  /** simple-icons 的图标 slug；找不到对应图标时会退化为首字母方块 */
  icon: string
}

export interface SkillGroup {
  category: string
  items: SkillItem[]
}

/**
 * 熟练度（1–5）是根据简历中的项目与获奖证据推断的，简历本身没有这一项。
 * 需要调整时直接改 level：1–2 了解 / 3 熟悉 / 4 熟练 / 5 精通。
 */
export const skillGroups: SkillGroup[] = [
  {
    category: '编程语言',
    items: [
      { name: 'C / C++', level: 4, icon: 'cplusplus' },
      { name: 'Python', level: 4, icon: 'python' },
      { name: 'TypeScript', level: 4, icon: 'typescript' },
      { name: 'SQL', level: 3, icon: 'mysql' },
      { name: 'Java', level: 3, icon: 'openjdk' },
    ],
  },
  {
    category: '前端与可视化',
    items: [
      { name: 'React', level: 4, icon: 'react' },
      { name: 'HTML / CSS', level: 4, icon: 'html5' },
      { name: '数据可视化', level: 4, icon: 'apacheecharts' },
      { name: 'Android 应用开发', level: 3, icon: 'android' },
    ],
  },
  {
    category: '后端与数据',
    items: [
      { name: '数据库设计', level: 3, icon: 'postgresql' },
      { name: '数据持久化', level: 3, icon: 'sqlite' },
      { name: '多端接口联调', level: 3, icon: 'postman' },
    ],
  },
  {
    category: '人工智能与算法',
    items: [
      { name: '深度学习模型构建', level: 4, icon: 'pytorch' },
      { name: 'YOLO 目标检测', level: 3, icon: 'yolo' },
      { name: 'BERT / 文本情感分析', level: 3, icon: 'huggingface' },
      { name: '统计建模（SEIR / VAR）', level: 3, icon: 'jupyter' },
    ],
  },
  {
    category: '数据工程',
    items: [
      { name: '数据爬取', level: 4, icon: 'scrapy' },
      { name: '数据清洗与特征工程', level: 4, icon: 'pandas' },
    ],
  },
  {
    category: '工具',
    items: [
      { name: 'Git', level: 3, icon: 'git' },
      { name: 'Linux', level: 3, icon: 'linux' },
    ],
  },
]

const LEVEL_LABELS: Record<SkillLevel, string> = {
  1: '了解',
  2: '初步了解',
  3: '熟悉',
  4: '熟练',
  5: '精通',
}

export function skillLevelLabel(level: SkillLevel): string {
  return LEVEL_LABELS[level]
}

/** 熟练度的文字级别表，供无障碍标签与提示复用 */
export const skillLevelLabels = LEVEL_LABELS
