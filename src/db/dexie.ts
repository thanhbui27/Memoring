import Dexie, { type Table } from 'dexie'
import type { Card } from '../types/card'
import type { Deck } from '../types/deck'
import type { AppSettings } from '../types/settings'
import type { TestResult } from '../types/test'

export class MemoRingDatabase extends Dexie {
  decks!: Table<Deck, string>
  cards!: Table<Card, string>
  testResults!: Table<TestResult, string>
  settings!: Table<AppSettings, string>

  constructor() {
    super('MemoRingDatabase')

    this.version(1).stores({
      decks: 'id, isDefault, createdAt, updatedAt',
      cards: 'id, deckId, tag, isFavorite, nextReviewAt, updatedAt',
      testResults: 'id, deckId, testType, createdAt',
      settings: 'id',
    })
  }
}

export const db = new MemoRingDatabase()
