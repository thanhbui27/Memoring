import { storageProvider } from '../storage/provider'
import type { Card } from '../types/card'
import { nowIso } from '../utils/date'
import { createId } from '../utils/id'

export type CardDraft = Omit<Card, 'id' | 'createdAt' | 'updatedAt' | 'correctCount' | 'wrongCount' | 'reviewLevel' | 'isFavorite'> & {
  isFavorite?: boolean
}

export const cardService = {
  getCards() {
    return storageProvider.getCards()
  },

  getCardsByDeck(deckId: string) {
    return storageProvider.getCardsByDeck(deckId)
  },

  async createCard(input: CardDraft) {
    const now = nowIso()
    const card: Card = {
      ...input,
      id: createId('card'),
      isFavorite: input.isFavorite ?? false,
      correctCount: 0,
      wrongCount: 0,
      reviewLevel: 0,
      createdAt: now,
      updatedAt: now,
    }
    await storageProvider.saveCard(card)
    return card
  },

  async updateCard(card: Card, patch: Partial<Card>) {
    const next = { ...card, ...patch, updatedAt: nowIso() }
    await storageProvider.saveCard(next)
    return next
  },

  async deleteCard(cardId: string) {
    await storageProvider.deleteCard(cardId)
  },
}
