import type { Card } from '../types/card'
import type { Deck } from '../types/deck'
import type { AppSettings } from '../types/settings'
import type { TestResult } from '../types/test'

export type MemoRingData = {
  decks: Deck[]
  cards: Card[]
  testResults: TestResult[]
  settings?: AppSettings
}

export interface StorageProvider {
  getDecks(): Promise<Deck[]>
  saveDeck(deck: Deck): Promise<void>
  deleteDeck(deckId: string): Promise<void>

  getCards(): Promise<Card[]>
  getCardsByDeck(deckId: string): Promise<Card[]>
  saveCard(card: Card): Promise<void>
  deleteCard(cardId: string): Promise<void>
  deleteCardsByDeck(deckId: string): Promise<void>

  getTestResults(): Promise<TestResult[]>
  saveTestResult(result: TestResult): Promise<void>
  deleteTestResultsByDeck(deckId: string): Promise<void>

  getSettings(): Promise<AppSettings | undefined>
  saveSettings(settings: AppSettings): Promise<void>

  exportData(): Promise<MemoRingData>
  replaceData(data: MemoRingData): Promise<void>
  reset(): Promise<void>
}
