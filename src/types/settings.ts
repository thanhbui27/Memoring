export type AppTheme = 'cream' | 'orange' | 'dark' | 'minimal'
export type SpeechRate = 'slow' | 'normal' | 'fast'

export type AppSettings = {
  id: string
  defaultDeckId?: string
  activeDeckId?: string
  speechRate: SpeechRate
  speechLanguage: string
  autoPronounce: boolean
  theme: AppTheme
}
