import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Resend } from 'resend'

import { contactSchema } from '../src/schemas/contact'

const WINDOW_MS = 10 * 60 * 1000
const MAX_HITS = 3

/**
 * 限流计数存在进程内存里。
 *
 * 这是**尽力而为**的反滥用手段：Vercel 多实例部署或冷启动后计数会重置，
 * 不能当作严格配额，也不要对外宣称它是可靠限流（AGENTS.md 七）。
 */
const hits = new Map<string, number[]>()

function allowRequest(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS)

  if (recent.length >= MAX_HITS) {
    hits.set(ip, recent)
    return false
  }

  recent.push(now)
  hits.set(ip, recent)
  return true
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, code: 'INVALID', message: '不支持的请求方法' })
  }

  const forwarded = req.headers['x-forwarded-for']
  const ip =
    (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim() ?? 'unknown'

  if (!allowRequest(ip)) {
    return res
      .status(429)
      .json({ ok: false, code: 'RATE_LIMITED', message: '提交过于频繁，请稍后再试' })
  }

  // 服务端必须重新校验：客户端校验只是体验优化，不是防线
  const parsed = contactSchema.safeParse(req.body)

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    const fields = {
      name: fieldErrors.name?.[0],
      email: fieldErrors.email?.[0],
      message: fieldErrors.message?.[0],
    }

    return res.status(400).json({ ok: false, code: 'INVALID', message: '请检查填写内容', fields })
  }

  const { name, email, message, company } = parsed.data

  if (company) {
    return res.status(400).json({ ok: false, code: 'INVALID', message: '提交被拒绝' })
  }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.CONTACT_FROM_EMAIL
  const to = process.env.CONTACT_TO_EMAIL

  if (!apiKey || !from || !to) {
    console.error('缺少邮件相关环境变量，无法发送留言')
    return res.status(500).json({
      ok: false,
      code: 'SEND_FAILED',
      message: '服务暂时不可用，请稍后重试或直接发邮件给我',
    })
  }

  try {
    const resend = new Resend(apiKey)

    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: `站点留言：来自 ${name}`,
      text: `姓名：${name}\n邮箱：${email}\n\n${message}`,
    })

    if (error) {
      console.error('Resend 返回错误', error)
      return res
        .status(500)
        .json({ ok: false, code: 'SEND_FAILED', message: '发送失败，请稍后重试或直接发邮件给我' })
    }

    return res.status(200).json({ ok: true })
  } catch (error) {
    // 只记录在服务端日志，不向客户端泄漏内部错误细节（PRD 3.7）
    console.error('发送留言失败', error)
    return res
      .status(500)
      .json({ ok: false, code: 'SEND_FAILED', message: '发送失败，请稍后重试或直接发邮件给我' })
  }
}
