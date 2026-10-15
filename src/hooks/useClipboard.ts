import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 复制到剪贴板，并在 `resetDelay` 后自动复位状态。
 * 失败时返回 failed，供调用方降级为「请手动复制」（PRD 3.7）。
 */
export function useClipboard(resetDelay = 2000) {
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  const copy = useCallback(
    async (text: string) => {
      let ok = false

      try {
        await navigator.clipboard.writeText(text)
        ok = true
      } catch {
        // 剪贴板权限被拒或 API 不可用：保持 ok 为 false，由调用方降级提示手动复制
      }

      setCopied(ok)
      setFailed(!ok)

      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => {
        setCopied(false)
        setFailed(false)
      }, resetDelay)
    },
    [resetDelay],
  )

  return { copy, copied, failed }
}
