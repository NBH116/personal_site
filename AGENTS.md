# AI 代理开发指令（AGENTS.md）

本文件面向在本仓库中工作的 AI 代理与协作者。**开始任何改动前先读完本文件与两份关联文档。**

| 文档 | 内容 | 何时查阅 |
|---|---|---|
| [PRD.md](./PRD.md) | 需求、优先级、设计要点、已知限制、验收标准 | 判断「做什么」与「做到什么程度」 |
| [TECH_DESIGN.md](./TECH_DESIGN.md) | 技术栈、目录结构、数据模型、关键技术点 | 判断「怎么做」与「代码放哪」 |
| 本文件 | 开发规范、约束与红线 | 每次动手前 |

---

## 一、项目概述

个人展示网站：单页式个人主页 + 项目展示 + Markdown 博客 + 联系表单。深色主题，全站 Canvas 星空背景，适配移动端到桌面端。

**技术栈（已锁定，不得擅自更换）**

| 项 | 选择 |
|---|---|
| 构建 | Vite |
| 框架 | React + TypeScript（strict） |
| 样式 | Tailwind CSS v4（CSS-first，`@theme` 令牌） |
| 路由 | react-router-dom（`BrowserRouter`） |
| Markdown | 运行时渲染：react-markdown + remark-gfm + rehype-slug + rehype-highlight |
| 校验 | Zod（构建期校验 frontmatter，运行期校验表单，前后端共用 schema） |
| 表单接口 | Vercel Functions（`api/contact.ts`）+ Resend |
| 测试 | Vitest + React Testing Library |

**渲染模式为纯客户端渲染，不做预渲染、不做 SSR。** 这是已确认的决策，不要主动引入 SSG/SSR 方案。

---

## 二、命令

| 命令 | 用途 | 备注 |
|---|---|---|
| `npm run dev` | 前端开发服务器 | **`/api/contact` 不可用** |
| `npm run dev:full`（即 `vercel dev`） | 前后端联调 | **验证表单的唯一正确方式** |
| `npm run build` | `tsc --noEmit && vite build` | 提交前必须通过 |
| `npm run preview` | 预览生产产物 | 接口不可用 |
| `npm run typecheck` | 单独类型检查 | |
| `npm run lint` | ESLint | |
| `npm run test` | Vitest 单次运行 | 提交前必须通过 |

### 关键注意事项：接口在 `npm run dev` 下不存在

Vite 开发服务器不处理 `api/` 目录。用 `npm run dev` 时提交表单必然失败，这是**预期行为，不是缺陷**。不要为了让它「看起来能用」而：
- 在客户端伪造成功响应；
- 加一个 Vite 中间件去 mock 接口；
- 把接口逻辑搬进前端。

需要调表单就用 `npm run dev:full`。

---

## 三、开发规范

### 3.1 目录职责边界（硬性）

| 目录 | 该做 | 不该做 |
|---|---|---|
| `src/pages/` | 路由级组件、取数据、拼装区块 | 不写通用样式细节 |
| `src/sections/` | 首页区块编排 | 不直接读 Markdown 文件，不写业务逻辑 |
| `src/components/` | 可复用的展示与交互单元 | 不感知路由；除 `ContactForm` 外不发请求 |
| `src/lib/` | 纯函数、数据装载（无 React） | 不写 JSX，不依赖 Node API |
| `src/data/` | 纯静态 TS 数据（带类型） | 不写逻辑 |
| `src/schemas/` | 校验规则的唯一真相来源 | 不放展示逻辑 |
| `api/` | 服务端函数 | **不得被 `src/` 任何文件引用** |

### 3.2 组件拆分判定

出现下列任一情况才新建组件文件：被两处及以上复用；内部有独立状态且超过约 30 行；需要单独测试。**不要**为「看起来更整洁」把一段只用一次的 JSX 抽成组件。首页区块统一放 `sections/`，不要塞进 `components/`。

### 3.3 内容与配置

- 所有文案、技能、经历、项目、文章一律放在 `src/content/`（Markdown）或 `src/data/`（TS）中，**禁止硬编码在 JSX 里**。
- 新增文章：在 `src/content/blog/` 下新建 `.md`，文件名即 URL slug。开发服务器会自动热更新；生产环境需要重新构建才会收录。
- 新增项目：在 `src/content/projects/` 下新建 `.md`。
- frontmatter 字段以 [TECH_DESIGN.md 第三节](./TECH_DESIGN.md) 的 Zod schema 为准。写错字段会在构建时直接报错中断——这是有意设计，不要放宽 schema 来「让它先跑起来」。

### 3.4 命名约定

- 组件文件与组件名：PascalCase（`ProjectCard.tsx`）。
- 工具、hook、数据、schema：camelCase（`useScrollSpy.ts`、`reading-time.ts`）。
- 页面组件以 `Page` 结尾（`BlogListPage.tsx`）。
- 组件一律**具名导出**（`export function ProjectCard()`），不用默认导出；页面由 `router.tsx` 统一 `React.lazy` 引入。
- CSS 变量与 Tailwind 令牌：kebab-case。

---

## 四、代码风格

- TypeScript **strict** 全开，且开启 `noUncheckedIndexedAccess`。不允许 `any`；确实无法推断时用 `unknown` 并在窄化后使用。
- 缩进 2 空格，单引号，语句末尾不加分号（由 Prettier 统一）。**提交前跑 `npm run format`。**
- 函数组件用 `function` 声明 + 具名导出。避免 `React.FC`。
- 事件处理函数命名 `handleXxx`，传给子组件的 prop 命名 `onXxx`。
- 列表渲染必须有稳定 `key`，不要用数组下标。
- 副作用必须在 `useEffect` 内并返回幂等的清理函数。**项目运行在 React StrictMode 下，effect 会执行两次**——任何订阅、定时器、Canvas 动画都必须能安全地重复挂载与卸载。
- 不做无意义的 memoization。`useMemo` / `useCallback` 只用于确有性能或引用稳定性需要的场景（如把回调传给 memo 化的子组件、Canvas 初始化参数）。
- 注释解释「为什么」，不复述「做了什么」。

**样式规则**

- 只用令牌派生的 Tailwind 类：`bg-bg`、`bg-surface`、`text-fg`、`text-fg-muted`、`border-border`、`text-accent`、`rounded-card`、`rounded-control`。
- **禁止硬编码色值**，包括 `bg-[#111726]`、`text-[rgb(...)]`、内联 `style={{ color: '#...' }}`。
- 需要新颜色时先在 `src/styles/global.css` 的 `@theme` 中加令牌，再在组件里使用。
- 复杂或重复的样式组合可以抽成 `@utility`，但不要为了少写几个类而引入组件级 CSS 文件。

---

## 五、设计约束

1. **深色专一**：只做深色主题，不实现浅色模式，不做 `prefers-color-scheme` 分支。
2. **重动效**：动效统一使用 `--ease-standard` 与 `150–300ms` 时长（入场可达 `600ms`）；滚动入场位移不超过 `16px`；不做持续循环的装饰性动画。
3. **必须尊重 `prefers-reduced-motion`**。任何新增动效（包括 `scroll-behavior`、CSS transition、Canvas 动画、打字机效果）都要在 `reduce` 下取消或退化为透明度变化。这是验收项，不是可选项。
4. **圆角**：卡片与面板 16px，按钮与输入框 12px，标签胶囊形。
5. **区块留白**：移动端 `64px`，桌面端 `96–120px`。
6. **响应式**：断点 `<640` 单列、`640–1024` 两列、`>1024` 三列；内容区最大宽度 `1200px`；任何断点下不得出现横向滚动条；触摸目标 ≥ `44×44px`。
7. **动效不得阻塞首屏**：星空与滚动入场动画都不能推迟首屏内容的渲染。
8. **无障碍硬性要求**：
   - 正文与背景对比度 ≥ 4.5:1，大字号 ≥ 3:1。
   - 键盘可完整操作全站；焦点样式清晰可见，不得 `outline: none` 而不给替代。
   - 图标按钮必须有 `aria-label`；图片必须有 `alt`（装饰图用 `alt=""`）。
   - 表单错误用 `aria-live` 播报，字段用 `aria-invalid` + `aria-describedby` 关联错误信息。
   - 不使用颜色作为唯一的信息载体（如技能熟练度不能只用进度条颜色表达）。

---

## 六、测试与验证要求

### 提交前必过

```bash
npm run typecheck   # 无错误
npm run lint        # 无错误
npm run test        # 全部通过
npm run build       # 构建成功
```

### 需要写测试的场景

- `src/lib/` 下的纯函数：内容排序、草稿过滤、归档过滤、标签聚合、阅读时长估算、目录合并。
- `src/schemas/contact.ts`：校验边界（空值、超长、非法邮箱、蜜罐非空）。
- `ContactForm`：五种状态（idle / validating / submitting / success / error）与失败后保留输入。
- `Navbar`：移动端菜单开合、`Esc` 关闭、焦点归还。

不要求为纯展示组件写测试。

### 验收标准核对（引用 [PRD.md 第七节](./PRD.md)）

功能自测完成后，必须逐条核对以下项目并在交付说明中给出结论：

| 编号 | 验收项 |
|---|---|
| A1 | 375px 宽度下无横向滚动 |
| A2 | 移动端星空帧率 ≥ 50fps |
| A3 | 新增 `.md` 后开发环境博客列表自动收录 |
| A4 | 表单具备真实成功与失败反馈（用 `npm run dev:full` 验证） |
| A5 | 深色主题下对比度达标（AA） |
| A6 | 键盘可完整操作全站 |
| A7 | `npm run build` 与 `tsc --noEmit` 通过 |
| A8 | 300px 极限窄屏下布局不崩 |
| A9 | Lighthouse Performance / Accessibility / Best Practices ≥ 90（**SEO 不设阈值**） |
| A10 | 路由直达刷新可访问，未知 slug 渲染 404 页 |

---

## 七、注意事项与红线

**不要做的事**

1. **不要更换技术栈**。不引入 Next.js、Astro、Remix 或其他框架/渲染模式。
2. **不要引入重型 UI 组件库**（antd、MUI、Chakra、shadcn 的整套脚手架等）。需要什么就用 Tailwind 写。
3. **不要引入状态管理库**（Redux、Zustand、Jotai）。本项目状态极浅，`useState` + Context 足够。
4. **不要在 `src/` 中引用 Node 内置模块或 Node-only 依赖**：`gray-matter`、`fs`、`path`、`resend`、`@vercel/node` 只能出现在 `vite.config.ts` 或 `api/` 中。把 `gray-matter` 打进客户端包会导致浏览器运行时抛 `Buffer is not defined`。
5. **不要提交任何密钥**。`RESEND_API_KEY` 等一律走环境变量；`.env*.local` 必须在 `.gitignore` 中。不要为了调试把密钥写进代码或提交到仓库。
6. **不要为了「让它能跑」而放宽 schema 或跳过校验**。构建期 frontmatter 校验报错是预期行为，正确做法是修正 Markdown 字段。
7. **不要在客户端伪造表单成功响应**（见第二节）。
8. **不要新增数据库**。联系表单的留言只发邮件，不落库。
9. **不要关闭 TypeScript strict 或加 `@ts-ignore` / `@ts-expect-error` 绕过类型错误**。确实需要时先说明原因。
10. **不要在 Canvas 循环内使用 `ctx.shadowBlur`**，也不要逐粒子创建渐变——性能会不达标。星点应预渲染为离屏贴图。

**容易出错的地方**

1. **`?meta` 查询参数**：列表页用 `import.meta.glob(..., { query: '?meta', eager: true })`，详情页用默认 glob 懒加载。写错会导致列表页把全部正文打进包，首页体积膨胀。改动 `vite.config.ts` 的插件时特别注意两个变体的输出。
2. **标题 id 一致性**：构建期用 `github-slugger` 生成，运行期由 `rehype-slug` 生成。两者的清洗规则必须一致，否则 TOC 锚点点不到。改动任一侧都要同步验证另一侧。
3. **`vercel.json` 重写顺序**：`/api/(.*)` 必须排在通配 `/(.*)` 之前，否则接口请求会被重写成 `index.html`，表单返回 HTML 而不是 JSON。
4. **StrictMode 双次执行**：Canvas 动画、事件监听、`IntersectionObserver` 都必须在清理函数中正确释放，否则路由切换会累积多个动画循环，帧率持续下降。
5. **接口在 `npm run dev` 下不可用**：再次强调，这不是 bug。
6. **锚点被吸顶导航遮挡**：所有带 `id` 的区块必须设置 `scroll-margin-top`。
7. **限流的局限**：`api/contact.ts` 的限流基于进程内存，多实例或冷启动后会重置，仅作尽力而为的反滥用，不要当作严格配额，也不要在文档中宣称它是可靠限流。

---

## 八、提交规范

- 一次提交只做一件事。避免把「新增功能」与「全局格式化」混在一起。
- 提交信息用中文，格式 `<类型>: <简短描述>`，类型取 `feat` / `fix` / `style` / `refactor` / `test` / `docs` / `chore`。
- 示例：`feat: 新增星空背景组件`、`fix: 修正博客详情页刷新后 404 的重写规则`。
- 提交前确认 `npm run build` 与 `npm run test` 均通过。

---

## 九、交付说明要求

完成一个功能或一个阶段后，简短说明：

1. 改了哪些文件、分别做了什么。
2. 如何验证（对应的命令与操作步骤）。
3. 触及了 PRD 哪些验收项，结论如何。
4. 任何未完成的部分或已知问题。

不要用「已完成」「全部通过」这类无信息量的结论，要给具体的核对结果。
