import { useEffect, useRef } from 'react'

import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

interface Star {
  x: number
  y: number
  radius: number
  baseAlpha: number
  phase: number
  speed: number
  /** 0–1，越大越「近」：更亮、视差位移更明显 */
  depth: number
}

const LAYER_COUNT = 3
const MAX_DEVICE_PIXEL_RATIO = 2
const PARALLAX_FACTOR = 0.02
const SPRITE_SIZE = 32
const RESIZE_DEBOUNCE_MS = 150
/** 视觉半径 → 贴图绘制尺寸的比例 */
const SPRITE_SCALE = 6

/** 按断点降级粒子数：移动端必须保住 50fps（PRD 4.2） */
function particleCountFor(width: number): number {
  if (width > 1024) return 160
  if (width >= 640) return 100
  return 60
}

/**
 * 把设计令牌里的十六进制色值转成带透明度的 rgba()。
 * 不直接用 color-mix()：它在 canvas 的 addColorStop 里兼容性不稳，传错会抛异常。
 */
function toRgba(color: string, alpha: number): string {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())
  if (!match) return color

  let value = match[1] ?? ''
  if (value.length === 3) {
    value = value
      .split('')
      .map((char) => char + char)
      .join('')
  }

  const red = Number.parseInt(value.slice(0, 2), 16)
  const green = Number.parseInt(value.slice(2, 4), 16)
  const blue = Number.parseInt(value.slice(4, 6), 16)

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

/**
 * 星点预渲染成一张离屏贴图。
 * 循环里只做 drawImage，绝不逐粒子 createRadialGradient 或用 shadowBlur——
 * 那两件事会让移动端帧率直接掉到 50fps 以下。
 */
function createStarSprite(color: string): HTMLCanvasElement {
  const sprite = document.createElement('canvas')
  sprite.width = SPRITE_SIZE
  sprite.height = SPRITE_SIZE

  const context = sprite.getContext('2d')
  if (!context) return sprite

  const center = SPRITE_SIZE / 2
  const gradient = context.createRadialGradient(center, center, 0, center, center, center)
  gradient.addColorStop(0, toRgba(color, 1))
  gradient.addColorStop(0.35, toRgba(color, 0.45))
  gradient.addColorStop(1, toRgba(color, 0))

  context.fillStyle = gradient
  context.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE)

  return sprite
}

function createStars(width: number, height: number, count: number): Star[] {
  const stars: Star[] = []

  for (let index = 0; index < count; index += 1) {
    const depth = ((index % LAYER_COUNT) + 1) / LAYER_COUNT

    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 0.4 + Math.random() * (0.5 + depth * 0.7),
      baseAlpha: 0.2 + depth * 0.35 * (0.6 + Math.random() * 0.4),
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 0.9,
      depth,
    })
  }

  return stars
}

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    // 颜色取自设计令牌，避免在组件里硬编码色值
    const tokenColor =
      getComputedStyle(document.documentElement).getPropertyValue('--color-fg').trim() || '#e6eaf2'
    const sprite = createStarSprite(tokenColor)

    let width = 0
    let height = 0
    let stars: Star[] = []
    let frame = 0
    let resizeTimer = 0
    let disposed = false
    let running = false

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO)
      width = window.innerWidth
      height = window.innerHeight

      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      // 让后续绘制代码统一使用 CSS 像素坐标
      context.setTransform(dpr, 0, 0, dpr, 0, 0)

      stars = createStars(width, height, particleCountFor(width))
    }

    const drawFrame = (timestamp: number) => {
      context.clearRect(0, 0, width, height)

      const scrollY = window.scrollY
      const seconds = timestamp / 1000

      for (const star of stars) {
        const parallax = scrollY * star.depth * PARALLAX_FACTOR
        const rawY = star.y - parallax
        // 取模让星星循环出现，否则视差会把上半屏拉空
        const y = ((rawY % height) + height) % height

        const twinkle = prefersReducedMotion
          ? 0
          : Math.sin(seconds * star.speed + star.phase) * 0.35
        const alpha = Math.min(1, Math.max(0, star.baseAlpha + twinkle))
        const size = star.radius * SPRITE_SCALE

        context.globalAlpha = alpha
        context.drawImage(sprite, star.x - size / 2, y - size / 2, size, size)
      }

      context.globalAlpha = 1
    }

    const loop = (timestamp: number) => {
      drawFrame(timestamp)
      frame = window.requestAnimationFrame(loop)
    }

    const start = () => {
      if (disposed || running) return
      running = true
      frame = window.requestAnimationFrame(loop)
    }

    const stop = () => {
      if (!running) return
      running = false
      window.cancelAnimationFrame(frame)
      frame = 0
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        stop()
      } else {
        start()
      }
    }

    const onResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        resizeCanvas()
        // 降级模式下不跑动画循环，需要在尺寸变化后补画一帧
        if (prefersReducedMotion) drawFrame(performance.now())
      }, RESIZE_DEBOUNCE_MS)
    }

    // 画布不可见时（例如后续布局变化把它移出视口）停掉循环
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !document.hidden) {
            start()
          } else {
            stop()
          }
        }
      },
      { threshold: 0 },
    )

    resizeCanvas()

    if (prefersReducedMotion) {
      // 静态降级：画一帧就停，不做任何持续动画
      drawFrame(performance.now())
    } else {
      observer.observe(canvas)
      document.addEventListener('visibilitychange', onVisibilityChange)
    }

    window.addEventListener('resize', onResize)

    return () => {
      disposed = true
      stop()
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('resize', onResize)
      window.clearTimeout(resizeTimer)
    }
  }, [prefersReducedMotion])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  )
}
