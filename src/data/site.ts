export interface SocialLink {
  label: string
  url: string
  /** simple-icons 的图标 slug，见 https://simpleicons.org */
  icon: string
}

export interface SiteConfig {
  name: string
  role: string
  org: string
  tagline: string
  bio: string[]
  location: string
  email: string
  phone: string
  avatar: string
  /** 缺省时 Hero 不渲染「下载简历」按钮（PRD 3.2 空态） */
  resumeUrl?: string
  socials: SocialLink[]
}

/**
 * 全部信息取自简历《个人简历.pdf》。
 * 新增社交账号时按下面的形状补进 socials 即可，图标名用 simple-icons 的 slug。
 */
export const site: SiteConfig = {
  name: '聂炳辉',
  role: '计算机科学与技术（拔尖实验班）',
  org: '大连海事大学',
  tagline: '在读本科生，关注 Web 开发、数据可视化与人工智能算法的工程落地。',
  bio: [
    '大连海事大学计算机科学与技术（拔尖实验班）2027 届本科生，平均学分绩点 3.80/5.00，加权综合排名 6/25。',
    '主要精力放在把算法能力落到可用系统上：在省级创新训练项目《智慧船舶智能火灾感知与应急系统》中主导 Web 端核心功能开发与数据库设计，承担人员态势可视化、热成像热力图渲染、报警日志与设备状态监控等模块；另在物理实验与统计建模类竞赛中完成从数据采集、清洗到模型构建与验证的全流程工作。',
    '核心课程成绩：数据结构 91、数据库原理 91、人工智能 90、信息系统分析与设计 95、程序设计实训 91、Android 平台应用开发技术实验 95、高等数学 100。英语水平 CET-4（462）、CET-6（465）。',
  ],
  location: '辽宁 · 大连',
  email: '2973450230@qq.com',
  phone: '17870855526',
  avatar: '/avatar.svg',
  resumeUrl: '/resume.pdf',
  // 简历中未提供其他社交账号，留空即可，组件会自动隐藏该区域
  socials: [],
}
