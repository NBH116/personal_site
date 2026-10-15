import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { login, logout } from '@/api'

import { RequireAuth } from './RequireAuth'

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={['/admin/posts/hello']}>
      <Routes>
        <Route path="/admin/login" element={<p>登录页</p>} />
        <Route
          path="/admin/posts/:slug"
          element={
            <RequireAuth>
              <p>受保护内容</p>
            </RequireAuth>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  logout()
})

describe('RequireAuth', () => {
  it('未登录时渲染登录页而不是受保护内容', () => {
    renderGuard()

    expect(screen.getByText('登录页')).toBeInTheDocument()
    expect(screen.queryByText('受保护内容')).not.toBeInTheDocument()
  })

  it('已有有效会话时渲染子内容', () => {
    login('admin', 'admin123')
    renderGuard()

    expect(screen.getByText('受保护内容')).toBeInTheDocument()
    expect(screen.queryByText('登录页')).not.toBeInTheDocument()
  })
})
