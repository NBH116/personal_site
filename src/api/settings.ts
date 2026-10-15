import type { SiteSettings } from '@/data/settings'

import { createSingleton } from './collection'
import { seedSettings } from './seed'

/**
 * 站点设置。
 * 强调色只存预设的 key，具体色值留在 `src/data/settings.ts`，
 * 这样换色板时不会把历史数据里已经固化的色值带出来。
 */

export const SETTINGS_STORE_NAME = 'settings'

const store = createSingleton<SiteSettings>({
  name: SETTINGS_STORE_NAME,
  seed: seedSettings,
})

export function getSettings(): SiteSettings {
  return store.get()
}

export function saveSettings(settings: SiteSettings): void {
  store.save(settings)
}

export function resetSettings(): void {
  store.reset()
}

export function isSettingsCustomized(): boolean {
  return store.isCustomized()
}
