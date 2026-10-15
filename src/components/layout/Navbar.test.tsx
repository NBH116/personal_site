import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { Navbar } from './Navbar'

function renderNavbar(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Navbar />
    </MemoryRouter>,
  )
}

const toggle = () => screen.getByRole('button', { name: /导航菜单$/ })

describe('Navbar', () => {
  it('渲染站点名与主导航项', () => {
    renderNavbar()

    expect(screen.getByRole('link', { name: '聂炳辉' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: '主导航' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '博客' })).toHaveAttribute('href', '/blog')
  })

  it('锚点导航统一指向 首页 + 锚点', () => {
    // react-router 会把只有 hash 的 to 解析为「当前路径 + hash」，
    // 所以首页的锚点链接渲染出来也是 /#skills，行为上仍是原地滚动。
    const { unmount } = renderNavbar('/')

    expect(screen.getByRole('link', { name: '技能' })).toHaveAttribute('href', '/#skills')

    unmount()
    renderNavbar('/blog')

    expect(screen.getAllByRole('link', { name: '技能' })[0]).toHaveAttribute('href', '/#skills')
  })

  it('当前路由在导航中标记 aria-current', () => {
    renderNavbar('/blog')

    expect(screen.getByRole('link', { name: '博客' })).toHaveAttribute('aria-current', 'true')
  })

  it('提供指向后台的入口链接', () => {
    renderNavbar()

    expect(screen.getByRole('link', { name: '后台' })).toHaveAttribute('href', '/admin')
  })

  it('移动端菜单里同样提供后台入口', async () => {
    const user = userEvent.setup()
    renderNavbar()

    await user.click(toggle())

    const panel = screen.getByRole('navigation', { name: '移动端导航' })
    expect(panel.querySelector('a[href="/admin"]')).not.toBeNull()
  })

  it('默认不渲染移动端菜单面板', () => {
    renderNavbar()

    expect(screen.queryByRole('navigation', { name: '移动端导航' })).not.toBeInTheDocument()
    expect(toggle()).toHaveAttribute('aria-expanded', 'false')
  })

  it('点击汉堡按钮展开移动端菜单并锁定背景滚动', async () => {
    const user = userEvent.setup()
    renderNavbar()

    await user.click(toggle())

    expect(toggle()).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('navigation', { name: '移动端导航' })).toBeInTheDocument()
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('按 Esc 关闭菜单并把焦点还给汉堡按钮', async () => {
    const user = userEvent.setup()
    renderNavbar()

    await user.click(toggle())

    // 打开后焦点按设计移入面板的首个链接
    const panel = screen.getByRole('navigation', { name: '移动端导航' })
    expect(panel.querySelector('a')).toHaveFocus()

    await user.keyboard('{Escape}')

    expect(toggle()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('navigation', { name: '移动端导航' })).not.toBeInTheDocument()
    expect(toggle()).toHaveFocus()
    expect(document.body.style.overflow).toBe('')
  })

  it('再次点击汉堡按钮收起菜单', async () => {
    const user = userEvent.setup()
    renderNavbar()

    await user.click(toggle())
    await user.click(toggle())

    expect(screen.queryByRole('navigation', { name: '移动端导航' })).not.toBeInTheDocument()
    expect(document.body.style.overflow).toBe('')
  })

  it('菜单展开后，面板内第一个可聚焦元素获得焦点', async () => {
    const user = userEvent.setup()
    renderNavbar()

    await user.click(toggle())

    const panel = screen.getByRole('navigation', { name: '移动端导航' })
    const firstLink = panel.querySelector('a')

    expect(firstLink).toHaveFocus()
  })
})
