import { db } from '../db/dexie'
import type { Card } from '../types/card'
import type { Deck } from '../types/deck'
import type { AppSettings } from '../types/settings'
import type { TestResult } from '../types/test'
import type { MemoRingData, StorageProvider } from './StorageProvider'

export class DexieStorageProvider implements StorageProvider {
  getDecks() {
    return db.decks.orderBy('createdAt').toArray()
  }

  async saveDeck(deck: Deck) {
    await db.decks.put(deck)
  }

  async deleteDeck(deckId: string) {
    await db.decks.delete(deckId)
  }

  getCards() {
    return db.cards.orderBy('updatedAt').reverse().toArray()
  }

  getCardsByDeck(deckId: string) {
    return db.cards.where('deckId').equals(deckId).reverse().sortBy('updatedAt')
  }

  async saveCard(card: Card) {
    await db.cards.put(card)
  }

  async deleteCard(cardId: string) {
    await db.cards.delete(cardId)
  }

  async deleteCardsByDeck(deckId: string) {
    await db.cards.where('deckId').equals(deckId).delete()
  }

  getTestResults() {
    return db.testResults.orderBy('createdAt').reverse().toArray()
  }

  async saveTestResult(result: TestResult) {
    await db.testResults.put(result)
  }

  async deleteTestResultsByDeck(deckId: string) {
    await db.testResults.where('deckId').equals(deckId).delete()
  }

  async getSettings() {
    return db.settings.get('app-settings')
  }

  async saveSettings(settings: AppSettings) {
    await db.settings.put(settings)
  }

  async exportData() {
    const [decks, cards, testResults, settings] = await Promise.all([
      db.decks.toArray(),
      db.cards.toArray(),
      db.testResults.toArray(),
      this.getSettings(),
    ])

    return { decks, cards, testResults, settings }
  }

  async replaceData(data: MemoRingData) {
    await db.transaction('rw', db.decks, db.cards, db.testResults, db.settings, async () => {
      await Promise.all([
        db.decks.clear(),
        db.cards.clear(),
        db.testResults.clear(),
        db.settings.clear(),
      ])
      await db.decks.bulkPut(data.decks)
      await db.cards.bulkPut(data.cards)
      await db.testResults.bulkPut(data.testResults)
      if (data.settings) await db.settings.put(data.settings)
    })
  }

  async reset() {
    await db.transaction('rw', db.decks, db.cards, db.testResults, db.settings, async () => {
      await Promise.all([
        db.decks.clear(),
        db.cards.clear(),
        db.testResults.clear(),
        db.settings.clear(),
      ])
    })
  }
}
