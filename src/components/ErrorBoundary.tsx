import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * 兜底渲染错误，避免整站白屏。
 * 这是唯一使用 class 的组件 —— 错误边界在 React 中没有函数式等价物。
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('页面渲染失败', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto flex w-full max-w-content flex-col items-start px-gutter py-section">
          <h1 className="text-2xl font-semibold text-fg">页面渲染出错了</h1>
          <p className="mt-3 text-fg-muted">
            这是前端运行时异常，刷新页面通常可以恢复。如果反复出现，请通过邮箱告诉我。
          </p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-6 inline-flex min-h-11 items-center rounded-control border border-border bg-surface px-5 text-sm text-fg transition-colors duration-200 ease-standard hover:bg-surface-hover"
          >
            重试
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
