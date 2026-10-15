export interface AwardItem {
  name: string
  detail: string
  date: string
}

export interface AwardGroup {
  level: string
  items: AwardItem[]
}

/** 荣誉奖项，分级与日期取自简历 */
export const awards: AwardGroup[] = [
  {
    level: '国家级',
    items: [
      {
        name: '第十一届全国大学生物理实验竞赛（创新）国家级二等奖',
        detail: '核心队员',
        date: '2025.10',
      },
      {
        name: '2025 年 ICAN 大学生创新创业竞赛 AI 应用创新挑战赛国家级三等奖',
        detail: '核心成员',
        date: '2025.12',
      },
      {
        name: '「正大杯」第十六届全国大学生市场调研与分析大赛国家级三等奖',
        detail: '负责人',
        date: '2026.04',
      },
    ],
  },
  {
    level: '省级',
    items: [
      {
        name: '第十一届全国大学生统计建模大赛省级一等奖',
        detail: '核心成员',
        date: '2025.06',
      },
      {
        name: '蓝桥杯全国大学生软件和信息技术大赛（C/C++）省级二等奖',
        detail: '',
        date: '2024.05',
      },
    ],
  },
  {
    level: '市校级',
    items: [
      {
        name: '校优秀学生奖学金一等奖、校三好学生、校优秀共青团干部等',
        detail: '',
        date: '',
      },
    ],
  },
]
