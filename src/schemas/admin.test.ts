import { describe, expect, it } from 'vitest'
import type { ZodError, ZodSafeParseResult } from 'zod'

import type { Post, Profile, Project } from '@/api/types'

import {
  collectMessages,
  firstFieldErrors,
  loginSchema,
  postFormSchema,
  profileSchema,
  projectFormSchema,
  settingsSchema,
  skillGroupSchema,
  toBlogFrontmatter,
  toPostFormValues,
  toProfileValues,
  toProjectFormValues,
} from './admin'

/** 各 schema 的最小合法值，测试里只覆盖被改动的字段 */
const VALID_POST = {
  slug: 'my-first-post',
  title: '标题',
  description: '摘要',
  date: '2026-10-15',
  updated: '',
  tags: ['React'],
  cover: '',
  draft: false,
  body: '正文',
}

const VALID_PROJECT = {
  slug: 'smart-ship',
  title: '标题',
  description: '摘要',
  date: '2026-10-15',
  tags: [],
  cover: '',
  role: '',
  period: '',
  repo: '',
  demo: '',
  featured: false,
  status: 'active' as const,
  body: '正文',
}

/**
 * 断言校验失败并取出错误对象。
 * `expect(result.success).toBe(false)` 不会让 TypeScript 窄化联合类型，
 * 所以统一走这个函数进入失败分支，避免测试里散落非空断言。
 */
function expectFailure<T>(result: ZodSafeParseResult<T>): ZodError<T> {
  expect(result.success).toBe(false)
  if (result.success) throw new Error('期望校验失败，但实际通过了')
  return result.error
}

describe('loginSchema', () => {
  it('账号去掉两侧空格后必须非空', () => {
    expect(loginSchema.safeParse({ username: ' admin ', password: 'x' }).success).toBe(true)

    const result = loginSchema.safeParse({ username: '   ', password: 'x' })
    expect(firstFieldErrors<'username' | 'password'>(expectFailure(result)).username).toBe('请输入账号')
  })

  it('空密码不通过', () => {
    expect(loginSchema.safeParse({ username: 'admin', password: '' }).success).toBe(false)
  })
})

describe('postFormSchema', () => {
  it('最小合法值通过', () => {
    expect(postFormSchema.safeParse(VALID_POST).success).toBe(true)
  })

  it.each([
    ['空标题', { ...VALID_POST, title: '  ' }],
    ['标题超长', { ...VALID_POST, title: 'a'.repeat(81) }],
    ['摘要超长', { ...VALID_POST, description: 'a'.repeat(161) }],
    ['日期格式不对', { ...VALID_POST, date: '2026/10/15' }],
    ['摘要为空', { ...VALID_POST, description: '' }],
  ])('%s 不通过', (_label, values) => {
    expect(postFormSchema.safeParse(values).success).toBe(false)
  })

  it.each([
    ['含大写字母', 'My-Post'],
    ['含下划线', 'my_post'],
    ['含中文', '我的文章'],
    ['以连字符开头', '-post'],
    ['以连字符结尾', 'post-'],
    ['连续连字符', 'my--post'],
    ['为空', ''],
  ])('slug %s 不通过', (_label, slug) => {
    expect(postFormSchema.safeParse({ ...VALID_POST, slug }).success).toBe(false)
  })

  it('正文不能为空', () => {
    expect(postFormSchema.safeParse({ ...VALID_POST, body: '' }).success).toBe(false)
  })

  it('标签数量与单个长度都有上限', () => {
    expect(postFormSchema.safeParse({ ...VALID_POST, tags: ['a'] }).success).toBe(true)
    expect(
      postFormSchema.safeParse({ ...VALID_POST, tags: Array.from({ length: 11 }, () => 'x') })
        .success,
    ).toBe(false)
    expect(postFormSchema.safeParse({ ...VALID_POST, tags: ['a'.repeat(21)] }).success).toBe(false)
  })

  it('封面只接受站内路径或完整 http(s) 链接', () => {
    expect(postFormSchema.safeParse({ ...VALID_POST, cover: '/images/a.webp' }).success).toBe(true)
    expect(postFormSchema.safeParse({ ...VALID_POST, cover: 'https://a.com/b.png' }).success).toBe(
      true,
    )
    expect(postFormSchema.safeParse({ ...VALID_POST, cover: 'images/a.webp' }).success).toBe(false)
  })
})

describe('projectFormSchema', () => {
  it('最小合法值通过', () => {
    expect(projectFormSchema.safeParse(VALID_PROJECT).success).toBe(true)
  })

  it('摘要上限是 120 字，比文章更短', () => {
    expect(
      projectFormSchema.safeParse({ ...VALID_PROJECT, description: 'a'.repeat(120) }).success,
    ).toBe(true)
    expect(
      projectFormSchema.safeParse({ ...VALID_PROJECT, description: 'a'.repeat(121) }).success,
    ).toBe(false)
  })

  it('仓库与演示地址只接受完整链接', () => {
    expect(
      projectFormSchema.safeParse({ ...VALID_PROJECT, repo: 'https://github.com/a/b' }).success,
    ).toBe(true)
    expect(projectFormSchema.safeParse({ ...VALID_PROJECT, repo: 'github.com/a/b' }).success).toBe(
      false,
    )
  })

  it('状态只接受三个枚举值', () => {
    expect(projectFormSchema.safeParse({ ...VALID_PROJECT, status: 'archived' }).success).toBe(true)
    expect(projectFormSchema.safeParse({ ...VALID_PROJECT, status: 'done' }).success).toBe(false)
  })
})

describe('settingsSchema', () => {
  const VALID = {
    siteTitle: '个人主页',
    siteDescription: '',
    accent: 'sky' as const,
    starfieldEnabled: true,
    homeProjectCount: 3,
    homePostCount: 3,
    footerNote: '',
  }

  it('最小合法值通过', () => {
    expect(settingsSchema.safeParse(VALID).success).toBe(true)
  })

  it('条数输入框清空产生的 NaN 会给出中文提示', () => {
    const result = settingsSchema.safeParse({ ...VALID, homeProjectCount: Number.NaN })
    expect(firstFieldErrors<'homeProjectCount'>(expectFailure(result)).homeProjectCount).toBe('请填写整数')
  })

  it('条数超出 1–12 的范围不通过', () => {
    expect(settingsSchema.safeParse({ ...VALID, homePostCount: 0 }).success).toBe(false)
    expect(settingsSchema.safeParse({ ...VALID, homePostCount: 13 }).success).toBe(false)
  })

  it('强调色只接受预设的 key', () => {
    expect(settingsSchema.safeParse({ ...VALID, accent: 'violet' }).success).toBe(true)
    expect(settingsSchema.safeParse({ ...VALID, accent: '#ff0000' }).success).toBe(false)
  })
})

describe('skillGroupSchema', () => {
  it('至少保留一项技能', () => {
    expect(skillGroupSchema.safeParse({ category: '前端', items: [] }).success).toBe(false)
    expect(
      skillGroupSchema.safeParse({
        category: '前端',
        items: [{ name: 'React', level: 4, icon: 'react' }],
      }).success,
    ).toBe(true)
  })

  it('熟练度只能是 1–5 的整数', () => {
    const group = (level: number) => ({
      category: '前端',
      items: [{ name: 'React', level, icon: '' }],
    })

    expect(skillGroupSchema.safeParse(group(0)).success).toBe(false)
    expect(skillGroupSchema.safeParse(group(6)).success).toBe(false)
    expect(skillGroupSchema.safeParse(group(3.5)).success).toBe(false)
  })

  it('技能名不能为空', () => {
    expect(
      skillGroupSchema.safeParse({
        category: '前端',
        items: [{ name: '  ', level: 3, icon: '' }],
      }).success,
    ).toBe(false)
  })
})

describe('profileSchema', () => {
  const VALID = {
    name: '张三',
    role: '',
    org: '',
    tagline: '',
    bio: [],
    location: '',
    email: 'a@example.com',
    phone: '',
    avatar: '',
    resumeUrl: '',
    socials: [],
    experience: [],
    awards: [],
  }

  it('最小合法值通过', () => {
    expect(profileSchema.safeParse(VALID).success).toBe(true)
  })

  it('邮箱格式不对不通过', () => {
    expect(profileSchema.safeParse({ ...VALID, email: 'not-an-email' }).success).toBe(false)
  })

  it('社交链接的地址必须是完整链接', () => {
    const social = { label: 'GitHub', url: 'https://github.com/a', icon: 'github' }
    expect(profileSchema.safeParse({ ...VALID, socials: [social] }).success).toBe(true)
    expect(
      profileSchema.safeParse({ ...VALID, socials: [{ ...social, url: 'github.com/a' }] }).success,
    ).toBe(false)
  })

  it('奖项日期允许留空，格式形如 2025.06', () => {
    const award = { level: '国家级', items: [{ name: '奖项', detail: '', date: '2025.06' }] }
    expect(profileSchema.safeParse({ ...VALID, awards: [award] }).success).toBe(true)
    expect(
      profileSchema.safeParse({
        ...VALID,
        awards: [{ level: '国家级', items: [{ name: '奖项', detail: '', date: '' }] }],
      }).success,
    ).toBe(true)
    expect(
      profileSchema.safeParse({
        ...VALID,
        awards: [{ level: '国家级', items: [{ name: '奖项', detail: '', date: '2025-06' }] }],
      }).success,
    ).toBe(false)
  })

  it('嵌套字段的错误路径能被 collectMessages 读出来', () => {
    const result = profileSchema.safeParse({
      ...VALID,
      experience: [
        {
          id: 'x',
          period: '',
          title: '项目',
          org: '',
          description: '',
          type: 'project',
          highlights: [],
        },
      ],
    })

    expect(collectMessages(expectFailure(result))[0]).toContain('experience.0')
  })
})

describe('持久化形状与表单形状的互转', () => {
  it('toBlogFrontmatter 丢掉为空的可选字段', () => {
    const frontmatter = toBlogFrontmatter({ ...VALID_POST })

    expect(frontmatter).not.toHaveProperty('updated')
    expect(frontmatter).not.toHaveProperty('cover')
    expect(frontmatter.title).toBe('标题')
  })

  it('toBlogFrontmatter 保留填过的可选字段', () => {
    const frontmatter = toBlogFrontmatter({
      ...VALID_POST,
      updated: '2026-10-16',
      cover: '/a.webp',
    })

    expect(frontmatter.updated).toBe('2026-10-16')
    expect(frontmatter.cover).toBe('/a.webp')
  })

  it('toPostFormValues 把缺省的可选字段补成空串', () => {
    const post: Post = {
      slug: 'a',
      frontmatter: { ...toBlogFrontmatter({ ...VALID_POST }) },
      readingTime: 1,
      body: '正文',
      headings: [],
    }

    expect(toPostFormValues(post)).toEqual({ ...VALID_POST, slug: 'a', updated: '', cover: '' })
  })

  it('toProjectFormValues 把 links 摊平成两个字段', () => {
    const project: Project = {
      slug: 'p',
      frontmatter: {
        title: '标题',
        description: '摘要',
        date: '2026-10-15',
        tags: [],
        links: { repo: 'https://github.com/a/b' },
        featured: true,
        status: 'wip',
      },
      body: '正文',
      headings: [],
    }

    const values = toProjectFormValues(project)
    expect(values.repo).toBe('https://github.com/a/b')
    expect(values.demo).toBe('')
    expect(values.featured).toBe(true)
    expect(values.status).toBe('wip')
  })

  it('toProfileValues 把 resumeUrl 缺失补成空串，并补齐 highlights', () => {
    const profile: Profile = {
      name: '张三',
      role: '',
      org: '',
      tagline: '',
      bio: [],
      location: '',
      email: 'a@example.com',
      phone: '',
      avatar: '',
      socials: [],
      experience: [
        { id: 'x', period: '2025', title: '项目', org: '', description: '', type: 'project' },
      ],
      awards: [],
    }

    const values = toProfileValues(profile)
    expect(values.resumeUrl).toBe('')
    expect(values.experience[0]?.highlights).toEqual([])
  })
})
