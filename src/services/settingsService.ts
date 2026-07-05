import type { AppSettings } from '../types/settings'
import { storageProvider } from '../storage/provider'

export const defaultSettings: AppSettings = {
  id: 'app-settings',
  speechRate: 'normal',
  speechLanguage: 'en-US',
  autoPronounce: false,
  theme: 'cream',
}

export const settingsService = {
  async getOrCreate() {
    const settings = await storageProvider.getSettings()
    if (settings) return settings
    await storageProvider.saveSettings(defaultSettings)
    return defaultSettings
  },

  async update(patch: Partial<AppSettings>) {
    const current = await this.getOrCreate()
    const next = { ...current, ...patch, id: 'app-settings' }
    await storageProvider.saveSettings(next)
    return next
  },
}
