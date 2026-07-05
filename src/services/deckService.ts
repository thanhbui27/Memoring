import { storageProvider } from '../storage/provider'
import type { Deck } from '../types/deck'
import { nowIso } from '../utils/date'
import { createId } from '../utils/id'

export const createDefaultDeck = (): Deck => {
  const now = nowIso()
  return {
    id: createId('deck'),
    name: 'Default Deck',
    description: 'Your first MemoRing stack',
    isDefault: true,
    color: '#f28c28',
    createdAt: now,
    updatedAt: now,
  }
}

export const deckService = {
  getDecks() {
    return storageProvider.getDecks()
  },

  async ensureDefaultDeck() {
    const decks = await storageProvider.getDecks()
    if (decks.length === 0) {
      const deck = createDefaultDeck()
      await storageProvider.saveDeck(deck)
      return deck
    }

    const defaultDeck = decks.find((deck) => deck.isDefault)
    if (defaultDeck) return defaultDeck

    const first = { ...decks[0], isDefault: true, updatedAt: nowIso() }
    await storageProvider.saveDeck(first)
    return first
  },

  async createDeck(input: { name: string; description?: string; color?: string }) {
    const now = nowIso()
    const deck: Deck = {
      id: createId('deck'),
      name: input.name.trim() || 'Untitled Deck',
      description: input.description?.trim(),
      color: input.color,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    }
    await storageProvider.saveDeck(deck)
    return deck
  },

  async updateDeck(deck: Deck, patch: Partial<Deck>) {
    const next = { ...deck, ...patch, updatedAt: nowIso() }
    await storageProvider.saveDeck(next)
    return next
  },

  async deleteDeck(deckId: string) {
    await storageProvider.deleteCardsByDeck(deckId)
    await storageProvider.deleteTestResultsByDeck(deckId)
    await storageProvider.deleteDeck(deckId)
  },

  async clearDeckData(deckId: string) {
    await Promise.all([
      storageProvider.deleteCardsByDeck(deckId),
      storageProvider.deleteTestResultsByDeck(deckId),
    ])
  },

  async setDefault(deckId: string) {
    const decks = await storageProvider.getDecks()
    await Promise.all(decks.map((deck) => storageProvider.saveDeck({
      ...deck,
      isDefault: deck.id === deckId,
      updatedAt: nowIso(),
    })))
  },
}
