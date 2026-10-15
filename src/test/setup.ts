import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

/**
 * jsdom 没有实现 matchMedia，而动效偏好与媒体查询 hook 都依赖它。
 * 默认返回 false（即不偏好减少动效）。
 *
 * 用 defineProperty 而不是 vi.stubGlobal：vi.unstubAllGlobals() 会把 stubGlobal
 * 装上的全局清掉，而这里的环境桩需要在整个测试会话中一直有效。
 */
const matchMedia = (query: string): MediaQueryList =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: matchMedia,
})

/** jsdom 同样没有 IntersectionObserver，滚动入场组件会用到它。 */
class MockIntersectionObserver {
  readonly root: Element | null = null
  readonly rootMargin = ''
  readonly thresholds: ReadonlyArray<number> = []

  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

Object.defineProperty(globalThis, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
})

// 测试配置没有开启 globals，RTL 的自动清理不会生效，需要显式挂上
afterEach(() => {
  cleanup()
})
