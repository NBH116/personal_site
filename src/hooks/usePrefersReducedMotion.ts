import { useMediaQuery } from './useMediaQuery'

/**
 * 用户的系统级动效偏好。
 * 所有动效（星空、平滑滚动、入场动画）都必须尊重它，这是 PRD 的验收项。
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
