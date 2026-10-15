import { getSettings } from '@/api'
import type { SiteSettings } from '@/data/settings'

import { useApiValue } from './useApiValue'

/** 站点设置（标题、强调色、星空开关、首页条数）。 */
export function useSettings(): SiteSettings {
  return useApiValue(getSettings)
}
