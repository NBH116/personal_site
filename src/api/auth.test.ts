import { afterEach, describe, expect, it } from 'vitest'

import {
  getConfiguredUsername,
  getSession,
  isAuthenticated,
  isUsingDefaultCredentials,
  login,
  logout,
  SESSION_STORE_NAME,
} from './auth'
import { readRaw, writeJson } from './storage'

afterEach(() => {
  logout()
})

describe('login', () => {
  it('默认凭据可以登录并拿到非空 token', () => {
    const session = login('admin', 'admin123')

    expect(session).not.toBeNull()
    expect(session?.token).toMatch(/^[0-9a-f]{48}$/)
    expect(session?.username).toBe('admin')
    expect(session?.expiresAt).toBeGreaterThan(Date.now())
  })

  it('账号或密码错误时返回 null', () => {
    expect(login('admin', 'wrong')).toBeNull()
    expect(login('someone', 'admin123')).toBeNull()
    expect(login('', '')).toBeNull()
  })

  it('账号两侧的空格被忽略', () => {
    expect(login('  admin  ', 'admin123')).not.toBeNull()
  })

  it('登录失败不会留下会话', () => {
    login('admin', 'wrong')

    expect(isAuthenticated()).toBe(false)
    expect(readRaw(SESSION_STORE_NAME)).toBeNull()
  })

  it('存储里不出现任何形式的密码', () => {
    login('admin', 'admin123')

    const raw = readRaw(SESSION_STORE_NAME) ?? ''
    expect(raw.length).toBeGreaterThan(0)
    expect(raw).not.toContain('admin123')
    expect(raw.toLowerCase()).not.toContain('password')
  })

  it('两次登录发出不同的 token', () => {
    const first = login('admin', 'admin123')
    const second = login('admin', 'admin123')

    expect(first?.token).not.toBe(second?.token)
  })
})

describe('getSession', () => {
  it('在没有写入过任何东西时返回 null', () => {
    expect(getSession()).toBeNull()
  })

  it('已过期的会话按未登录处理', () => {
    writeJson(SESSION_STORE_NAME, {
      token: 'deadbeef',
      username: 'admin',
      issuedAt: Date.now() - 10_000,
      expiresAt: Date.now() - 1,
    })

    expect(getSession()).toBeNull()
    expect(isAuthenticated()).toBe(false)
  })

  it('结构不完整的会话按未登录处理', () => {
    writeJson(SESSION_STORE_NAME, { token: '', username: 'admin', expiresAt: Date.now() + 1000 })
    expect(getSession()).toBeNull()

    writeJson(SESSION_STORE_NAME, { username: 'admin', expiresAt: Date.now() + 1000 })
    expect(getSession()).toBeNull()

    writeJson(SESSION_STORE_NAME, { token: 'abc', expiresAt: Date.now() + 1000 })
    expect(getSession()).toBeNull()
  })

  it('返回稳定引用，供 useSyncExternalStore 当快照使用', () => {
    login('admin', 'admin123')
    expect(getSession()).toBe(getSession())
  })
})

describe('logout', () => {
  it('清掉会话', () => {
    login('admin', 'admin123')
    expect(isAuthenticated()).toBe(true)

    logout()

    expect(isAuthenticated()).toBe(false)
    expect(readRaw(SESSION_STORE_NAME)).toBeNull()
  })
})

describe('凭据配置', () => {
  it('测试环境没有配置环境变量，因此视为默认凭据', () => {
    expect(isUsingDefaultCredentials()).toBe(true)
    expect(getConfiguredUsername()).toBe('admin')
  })
})
