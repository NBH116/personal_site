import { createSingleton } from './collection'
import { seedProfile } from './seed'
import type { Profile } from './types'

/**
 * 个人信息。
 *
 * 用单例仓储而不是拆成「站点配置 / 经历 / 荣誉」三个集合：
 * 后台的「个人信息」是一个表单，拆开之后表单要同时读写三处，
 * 校验与「恢复默认」的粒度也会变得难以解释。
 */

export const PROFILE_STORE_NAME = 'profile'

const store = createSingleton<Profile>({
  name: PROFILE_STORE_NAME,
  seed: seedProfile,
})

export function getProfile(): Profile {
  return store.get()
}

export function saveProfile(profile: Profile): void {
  store.save(profile)
}

export function resetProfile(): void {
  store.reset()
}

export function isProfileCustomized(): boolean {
  return store.isCustomized()
}
