import type { AppSettings } from '../types/settings'

const rateMap = {
  slow: 0.75,
  normal: 1,
  fast: 1.25,
}

export const speechService = {
  speak(text: string | undefined, settings: AppSettings | undefined) {
    if (!text?.trim() || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = settings?.speechLanguage || 'en-US'
    utterance.rate = rateMap[settings?.speechRate || 'normal']
    window.speechSynthesis.speak(utterance)
  },

  stop() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  },
}
