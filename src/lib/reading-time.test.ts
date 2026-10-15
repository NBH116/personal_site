import { describe, expect, it } from 'vitest'

import { estimateReadingTime } from './reading-time'

describe('estimateReadingTime', () => {
  it('空字符串返回下限 1 分钟', () => {
    expect(estimateReadingTime('')).toBe(1)
  })

  it('极短内容也返回 1 分钟而不是 0', () => {
    expect(estimateReadingTime('你好')).toBe(1)
  })

  it('按中文 350 字/分钟估算', () => {
    const text = '中'.repeat(700)
    expect(estimateReadingTime(text)).toBe(2)
  })

  it('按英文 200 词/分钟估算', () => {
    const text = Array.from({ length: 400 }, () => 'word').join(' ')
    expect(estimateReadingTime(text)).toBe(2)
  })

  it('中英混排时两部分分别计入', () => {
    const text = `${'中'.repeat(350)} ${Array.from({ length: 200 }, () => 'word').join(' ')}`
    expect(estimateReadingTime(text)).toBe(2)
  })

  it('不把代码块计入正文字数', () => {
    const code = '```ts\nconst value = 1\n```'
    const withCode = estimateReadingTime(`正文一段。\n\n${code}`)
    const withoutCode = estimateReadingTime('正文一段。')

    expect(withCode).toBe(withoutCode)
  })

  it('不把链接地址计入正文字数', () => {
    const longUrl = `[链接](https://example.com/${'a'.repeat(400)})`
    expect(estimateReadingTime(longUrl)).toBe(1)
  })
})
