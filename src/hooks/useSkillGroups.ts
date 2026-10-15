import { listSkillGroups } from '@/api'
import type { SkillGroup } from '@/data/skills'

import { useApiValue } from './useApiValue'

/** 技能分组，前台「技能」区块与后台「技能管理」页共用。 */
export function useSkillGroups(): SkillGroup[] {
  return useApiValue(listSkillGroups)
}
