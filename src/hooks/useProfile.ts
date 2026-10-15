import { getProfile } from '@/api'
import type { Profile } from '@/api/types'

import { useApiValue } from './useApiValue'

/**
 * 个人信息（含经历时间线与荣誉奖项）。
 * 前台多个区块共用这一份数据，后台「个人信息」页改完之后所有订阅者一起更新。
 */
export function useProfile(): Profile {
  return useApiValue(getProfile)
}
