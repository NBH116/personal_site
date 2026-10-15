import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'

import { App } from '@/App'
import { RequireAuth } from '@/components/admin/RequireAuth'
import { PageLoading } from '@/components/layout/PageLoading'
import { NotFoundPage } from '@/pages/NotFoundPage'

/**
 * 路由表。
 *
 * 页面一律在这里用 React.lazy 引入（AGENTS.md 3.4）：
 * 文章详情页会连带引入 Markdown 解析器与高亮器，不能让它进入首屏包。
 * 后台整块同理 —— 它是另一个入口，前台访客不应该为它下载哪怕一个字节。
 *
 * 404 页保持静态导入 —— 它必须随时可用，不能依赖一次额外的分包请求。
 */
const HomePage = lazy(() =>
  import('@/pages/HomePage').then((module) => ({ default: module.HomePage })),
)
const BlogListPage = lazy(() =>
  import('@/pages/BlogListPage').then((module) => ({ default: module.BlogListPage })),
)
const BlogPostPage = lazy(() =>
  import('@/pages/BlogPostPage').then((module) => ({ default: module.BlogPostPage })),
)
const ProjectsPage = lazy(() =>
  import('@/pages/ProjectsPage').then((module) => ({ default: module.ProjectsPage })),
)
const ProjectDetailPage = lazy(() =>
  import('@/pages/ProjectDetailPage').then((module) => ({ default: module.ProjectDetailPage })),
)

/* ------------------------------------------------------------------
   后台。整块懒加载，与前台路由彻底隔离：两边不共用布局，
   后台也不会被前台的 `*` 兜底捕获。
   ------------------------------------------------------------------ */

const AdminLayout = lazy(() =>
  import('@/components/admin/AdminLayout').then((module) => ({ default: module.AdminLayout })),
)
const AdminLoginPage = lazy(() =>
  import('@/pages/admin/AdminLoginPage').then((module) => ({ default: module.AdminLoginPage })),
)
const AdminDashboardPage = lazy(() =>
  import('@/pages/admin/AdminDashboardPage').then((module) => ({
    default: module.AdminDashboardPage,
  })),
)
const AdminProfilePage = lazy(() =>
  import('@/pages/admin/AdminProfilePage').then((module) => ({ default: module.AdminProfilePage })),
)
const AdminSkillsPage = lazy(() =>
  import('@/pages/admin/AdminSkillsPage').then((module) => ({ default: module.AdminSkillsPage })),
)
const AdminProjectsPage = lazy(() =>
  import('@/pages/admin/AdminProjectsPage').then((module) => ({ default: module.AdminProjectsPage })),
)
const AdminProjectEditPage = lazy(() =>
  import('@/pages/admin/AdminProjectEditPage').then((module) => ({
    default: module.AdminProjectEditPage,
  })),
)
const AdminPostsPage = lazy(() =>
  import('@/pages/admin/AdminPostsPage').then((module) => ({ default: module.AdminPostsPage })),
)
const AdminPostEditPage = lazy(() =>
  import('@/pages/admin/AdminPostEditPage').then((module) => ({
    default: module.AdminPostEditPage,
  })),
)
const AdminSettingsPage = lazy(() =>
  import('@/pages/admin/AdminSettingsPage').then((module) => ({ default: module.AdminSettingsPage })),
)

/**
 * 后台的外壳只在需要时下载，所以它自己外面还要一层 Suspense。
 * 兜底沿用前台的骨架：这一屏几乎只会闪一下，不值得为它再写一个组件。
 */
function AdminGuard() {
  return (
    <RequireAuth>
      <Suspense fallback={<PageLoading label="正在加载后台" />}>
        <AdminLayout />
      </Suspense>
    </RequireAuth>
  )
}

export const router = createBrowserRouter([
  /* 登录页不与上面那组共用布局：`AdminLayout` 本身就是受保护的，
     而登录页必须在未登录状态下可见 */
  {
    path: '/admin/login',
    element: <AdminLoginPage />,
  },
  {
    path: '/admin',
    element: <AdminGuard />,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'profile', element: <AdminProfilePage /> },
      { path: 'skills', element: <AdminSkillsPage /> },
      { path: 'projects', element: <AdminProjectsPage /> },
      // `new` 必须与 `:slug` 并列声明：静态段在匹配时优先级更高，
      // 但把 `new` 写在前面能让这个意图更直白
      { path: 'projects/new', element: <AdminProjectEditPage /> },
      { path: 'projects/:slug', element: <AdminProjectEditPage /> },
      { path: 'posts', element: <AdminPostsPage /> },
      { path: 'posts/new', element: <AdminPostEditPage /> },
      { path: 'posts/:slug', element: <AdminPostEditPage /> },
      { path: 'settings', element: <AdminSettingsPage /> },
      // 后台内部拼错的地址没东西可展示，与其造一个「后台专用 404」，
      // 不如直接用前台那一页 —— 上面的入口都是有效的
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/:slug', element: <ProjectDetailPage /> },
      { path: 'blog', element: <BlogListPage /> },
      { path: 'blog/:slug', element: <BlogPostPage /> },
      // 兜底：未知路径渲染 404 页而不是空白（PRD A10）
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
