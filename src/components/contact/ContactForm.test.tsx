import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ContactForm } from './ContactForm'

const VALID = {
  name: '张三',
  email: 'zhangsan@example.com',
  message: '这是一条长度足够的测试留言内容。',
}

function stubFetch(response: Partial<Response> & { json: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

async function fillValidForm() {
  const user = userEvent.setup()

  await user.type(screen.getByLabelText('称呼'), VALID.name)
  await user.type(screen.getByLabelText('邮箱'), VALID.email)
  await user.type(screen.getByLabelText('留言'), VALID.message)

  return user
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ContactForm', () => {
  it('初始为 idle：无错误提示、无状态文案', () => {
    render(<ContactForm />)

    expect(screen.getByRole('status')).toHaveTextContent('')
    expect(screen.queryByText('请填写称呼')).not.toBeInTheDocument()
  })

  it('字段为空时提交：全量校验拦截，不发起请求', async () => {
    const fetchMock = stubFetch({ ok: true, status: 200, json: async () => ({ ok: true }) })
    const user = userEvent.setup()

    render(<ContactForm />)
    await user.click(screen.getByRole('button', { name: '发送留言' }))

    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByText('请填写称呼')).toBeInTheDocument()
    expect(screen.getByText('邮箱格式不正确')).toBeInTheDocument()
    expect(screen.getByText('留言至少 10 个字')).toBeInTheDocument()
    expect(screen.getByText('请先修正表单中标出的问题。')).toBeInTheDocument()
  })

  it('错误字段标记 aria-invalid 并用 aria-describedby 关联提示', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)

    await user.click(screen.getByRole('button', { name: '发送留言' }))

    const nameInput = screen.getByLabelText('称呼')
    const describedBy = nameInput.getAttribute('aria-describedby')

    expect(nameInput).toHaveAttribute('aria-invalid', 'true')
    expect(describedBy).toBe('contact-name-error')
    expect(document.getElementById(describedBy ?? '')).toHaveTextContent('请填写称呼')
  })

  it('失焦时只校验当前字段', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)

    await user.click(screen.getByLabelText('称呼'))
    await user.tab()

    expect(screen.getByText('请填写称呼')).toBeInTheDocument()
    expect(screen.queryByText('邮箱格式不正确')).not.toBeInTheDocument()
  })

  it('提交成功后展示成功提示并清空表单', async () => {
    const fetchMock = stubFetch({ ok: true, status: 200, json: async () => ({ ok: true }) })
    render(<ContactForm />)

    const user = await fillValidForm()
    await user.click(screen.getByRole('button', { name: '发送留言' }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('留言已发送')
    })

    expect(screen.getByLabelText('称呼')).toHaveValue('')
    expect(screen.getByLabelText('邮箱')).toHaveValue('')
    expect(screen.getByLabelText('留言')).toHaveValue('')

    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe('/api/contact')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toMatchObject(VALID)
  })

  it('接口返回失败时展示服务端文案并保留已填内容', async () => {
    stubFetch({
      ok: false,
      status: 500,
      json: async () => ({
        ok: false,
        code: 'SEND_FAILED',
        message: '发送失败，请稍后重试或直接发邮件给我',
      }),
    })

    render(<ContactForm />)
    const user = await fillValidForm()
    await user.click(screen.getByRole('button', { name: '发送留言' }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('发送失败，请稍后重试或直接发邮件给我')
    })

    expect(screen.getByLabelText('称呼')).toHaveValue(VALID.name)
    expect(screen.getByLabelText('邮箱')).toHaveValue(VALID.email)
    expect(screen.getByLabelText('留言')).toHaveValue(VALID.message)
  })

  it('接口返回字段级错误时把它们回填到对应字段', async () => {
    stubFetch({
      ok: false,
      status: 400,
      json: async () => ({
        ok: false,
        code: 'INVALID',
        message: '请检查填写内容',
        fields: { email: '邮箱域名被拒绝' },
      }),
    })

    render(<ContactForm />)
    const user = await fillValidForm()
    await user.click(screen.getByRole('button', { name: '发送留言' }))

    await waitFor(() => {
      expect(screen.getByText('邮箱域名被拒绝')).toBeInTheDocument()
    })

    expect(screen.getByLabelText('邮箱')).toHaveAttribute('aria-invalid', 'true')
  })

  it('限流时展示服务端返回的提示', async () => {
    stubFetch({
      ok: false,
      status: 429,
      json: async () => ({
        ok: false,
        code: 'RATE_LIMITED',
        message: '提交过于频繁，请稍后再试',
      }),
    })

    render(<ContactForm />)
    const user = await fillValidForm()
    await user.click(screen.getByRole('button', { name: '发送留言' }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('提交过于频繁，请稍后再试')
    })
  })

  it('网络异常时给出网络错误提示，不暴露内部错误', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')))

    render(<ContactForm />)
    const user = await fillValidForm()
    await user.click(screen.getByRole('button', { name: '发送留言' }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('网络连接失败')
    })

    // 原始错误信息不应出现在界面上
    expect(screen.queryByText(/Failed to fetch/)).not.toBeInTheDocument()
  })

  it('接口返回 HTML（dev 环境下接口不存在）时降级为通用失败提示', async () => {
    stubFetch({
      ok: false,
      status: 404,
      json: async () => {
        throw new SyntaxError('Unexpected token <')
      },
    })

    render(<ContactForm />)
    const user = await fillValidForm()
    await user.click(screen.getByRole('button', { name: '发送留言' }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('发送失败')
    })
  })

  it('提交中禁用按钮，避免重复提交', async () => {
    let resolveRequest: ((value: unknown) => void) | undefined
    const pending = new Promise((resolve) => {
      resolveRequest = resolve
    })

    vi.stubGlobal('fetch', vi.fn().mockReturnValue(pending))

    render(<ContactForm />)
    const user = await fillValidForm()
    await user.click(screen.getByRole('button', { name: '发送留言' }))

    expect(screen.getByRole('button', { name: /发送中/ })).toBeDisabled()

    resolveRequest?.({ ok: true, status: 200, json: async () => ({ ok: true }) })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '发送留言' })).toBeEnabled()
    })
  })
})
