---
title: "用 Vite + React 19 + Tailwind v4 搭一个纯客户端个人站"
description: "记录这个站点的技术选型与两个具体决策：为什么 Markdown 放在运行时渲染，以及如何避免把全部正文打进列表页的包。"
date: "2025-10-15"
tags: ["Vite", "React", "Tailwind CSS"]
draft: true
---

> 这是一篇草稿，先在开发环境验证内容与排版，再决定是否发布。

## 选型：把「不做的事」先定下来

选框架之前先把边界划清楚，比比较框架特性更有用。这个站点的边界是：

- 不需要数据库，唯一的服务端逻辑是转发一封邮件；
- 不需要登录、评论、搜索；
- 内容以 Markdown 文件承载，改完提交即可；
- **不做预渲染，也不做 SSR**。

在这个边界下，Next.js 的 App Router 与渲染模式体系属于用不上的复杂度，Astro 的优势（零 JS 静态输出）又恰好被「不做预渲染」抵消。Vite 的构建链路最短、心智模型最直接，代价是接受 SEO 较弱的已知限制。

## 决策一：Markdown 在运行时渲染

构建期编译（MDX 或自写插件输出 HTML）能让客户端不带解析器，包更小。运行时渲染的收益是调试路径短——改样式、加自定义组件时不需要理解编译产物。

选了运行时渲染，就必须在构建期解决两件事，否则列表页会把所有文章正文打进包里：

1. 抽取 frontmatter 并校验；
2. 抽取标题生成目录。

做法是写一个 Vite 转换插件，把 `.md` 变成 JS 模块，并用 `?meta` 查询参数提供一个「只有元数据」的变体：

```ts
// 列表页：只加载元数据，正文不进包
const blogMeta = import.meta.glob('/src/content/blog/*.md', {
  query: '?meta',
  eager: true,
  import: 'default',
})

// 详情页：懒加载正文
const blogBody = import.meta.glob('/src/content/blog/*.md', {
  import: 'default',
})
```

插件按查询参数决定是否输出 `body` 字段。列表页拿不到正文，也就没法把它打进包里。

## 决策二：frontmatter 校验失败就让构建中断

frontmatter 用 Zod 校验。字段写错时**直接抛错中断构建**，而不是回退到默认值。这条规则容易被当成麻烦，但它的收益是：内容错误在构建期暴露，而不是在线上表现为一个空白的卡片。

代价是写 Markdown 时必须核对字段，不能凭记忆瞎写。这个代价可以接受。

## 关于目录锚点的一个坑

标题 id 在一侧由构建期的 `github-slugger` 生成，另一侧由运行时的 `rehype-slug` 生成。**两者的清洗规则必须一致**，否则点目录会跳不到位置。

这类问题的隐蔽之处在于：文章里标题是纯中文时通常没事，一旦标题里带了反引号、加粗或标点，两套规则就可能分叉。所以改任一侧的清洗逻辑时，都要同步验证另一侧。

## 动效与无障碍

站点有星空 Canvas 背景和滚动入场两处动效。两处都必须尊重 `prefers-reduced-motion`：

```css
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }

  *,
  *::before,
  *::after {
    transition-duration: 0.01ms !important;
  }
}
```

星空在降级模式下只画一帧静态画面，不启动动画循环——这比「把动画速度降到极慢」更好，因为后者仍在持续消耗 CPU。

## 待办

- [ ] 补上文章页的阅读进度条
- [ ] 把强调色做成可在界面上切换的选项
- [ ] 检查 300px 极限窄屏下的排版
