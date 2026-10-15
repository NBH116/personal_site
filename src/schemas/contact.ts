import { z } from 'zod'

/**
 * 表单校验规则的唯一真相来源：客户端与服务端（api/contact.ts）共用。
 * 服务端必须重新校验，客户端的校验只是体验优化。
 */
export const contactSchema = z.object({
  name: z.string().trim().min(1, '请填写称呼').max(50, '称呼最多 50 个字'),
  email: z.string().trim().email('邮箱格式不正确').max(120, '邮箱过长'),
  message: z.string().trim().min(10, '留言至少 10 个字').max(1000, '留言最多 1000 个字'),
  // 蜜罐字段：正常用户不可见且应始终为空
  company: z.string().max(0, '提交被拒绝').optional().default(''),
})

export type ContactInput = z.infer<typeof contactSchema>

export type ContactFieldErrors = Partial<Record<'name' | 'email' | 'message', string>>

export type ContactResponse =
  | { ok: true }
  | {
      ok: false
      code: 'INVALID' | 'RATE_LIMITED' | 'SEND_FAILED'
      message: string
      fields?: ContactFieldErrors
    }
