import { describe, expect, it } from 'vitest'

import { contactSchema } from './contact'

const VALID = {
  name: '张三',
  email: 'zhangsan@example.com',
  message: '这是一条长度足够的测试留言内容。',
  company: '',
}

type Field = 'name' | 'email' | 'message' | 'company'

function parse(input: unknown) {
  return contactSchema.safeParse(input)
}

/** 取某个字段的首条错误信息；校验意外通过时返回 undefined，便于直接断言 */
function fieldError(input: unknown, field: Field): string | undefined {
  const result = contactSchema.safeParse(input)
  if (result.success) return undefined
  return result.error.flatten().fieldErrors[field]?.[0]
}

describe('contactSchema', () => {
  it('接受合法输入', () => {
    expect(parse(VALID).success).toBe(true)
  })

  it('去掉首尾空白后再校验', () => {
    const result = parse({ ...VALID, name: '  张三  ' })

    expect(result.success && result.data.name).toBe('张三')
  })

  it('company 缺省时补为空字符串', () => {
    const { company: _company, ...withoutCompany } = VALID
    const result = contactSchema.safeParse(withoutCompany)

    expect(result.success && result.data.company).toBe('')
  })

  describe('称呼', () => {
    it('空值被拒绝', () => {
      expect(fieldError({ ...VALID, name: '' }, 'name')).toBe('请填写称呼')
    })

    it('只有空白字符被拒绝', () => {
      expect(parse({ ...VALID, name: '   ' }).success).toBe(false)
    })

    it('超过 50 字被拒绝', () => {
      expect(parse({ ...VALID, name: '张'.repeat(51) }).success).toBe(false)
    })

    it('正好 50 字通过', () => {
      expect(parse({ ...VALID, name: '张'.repeat(50) }).success).toBe(true)
    })
  })

  describe('邮箱', () => {
    it.each(['not-an-email', 'a@b', '@example.com', 'a b@example.com', ''])(
      '非法邮箱被拒绝：%s',
      (email) => {
        expect(parse({ ...VALID, email }).success).toBe(false)
      },
    )

    it('超过 120 字被拒绝', () => {
      const email = `${'a'.repeat(120)}@example.com`
      expect(parse({ ...VALID, email }).success).toBe(false)
    })
  })

  describe('留言', () => {
    it('少于 10 字被拒绝', () => {
      expect(fieldError({ ...VALID, message: '太短了' }, 'message')).toBe('留言至少 10 个字')
    })

    it('正好 10 字通过', () => {
      expect(parse({ ...VALID, message: '十'.repeat(10) }).success).toBe(true)
    })

    it('超过 1000 字被拒绝', () => {
      expect(fieldError({ ...VALID, message: '长'.repeat(1001) }, 'message')).toBe(
        '留言最多 1000 个字',
      )
    })
  })

  describe('蜜罐字段', () => {
    it('非空时校验失败，用于拦截机器人', () => {
      expect(fieldError({ ...VALID, company: '被机器人填了' }, 'company')).toBe('提交被拒绝')
    })
  })

  it('字段全部缺失时校验失败', () => {
    expect(parse({}).success).toBe(false)
  })
})
