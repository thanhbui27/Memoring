import { create } from 'zustand'
import { cardService, type CardDraft } from '../services/cardService'
import { deckService } from '../services/deckService'
import { importExportService } from '../services/importExportService'
import { reviewService } from '../services/reviewService'
import { settingsService } from '../services/settingsService'
import { testService } from '../services/testService'
import type { Card, ReviewGrade } from '../types/card'
import type { Deck } from '../types/deck'
import type { AppSettings } from '../types/settings'
import type { TestResult, TestType } from '../types/test'

export type AppView = 'study' | 'decks' | 'cards' | 'editor' | 'test' | 'settings' | 'stats'
export type ToastKind = 'success' | 'error' | 'info'

type ToastState = {
  message: string
  kind: ToastKind
}

type AppStore = {
  isReady: boolean
  currentView: AppView
  editingCardId?: string
  decks: Deck[]
  cards: Card[]
  allCards: Card[]
  testResults: TestResult[]
  settings?: AppSettings
  activeDeckId?: string
  toast?: ToastState

  loadData: () => Promise<void>
  setView: (view: AppView) => void
  openEditor: (cardId?: string) => void
  showToast: (message: string, kind?: ToastKind) => void
  clearToast: () => void

  setActiveDeck: (deckId: string) => Promise<void>
  createDeck: (name: string, description?: string, color?: string) => Promise<void>
  updateDeck: (deck: Deck, patch: Partial<Deck>) => Promise<void>
  deleteDeck: (deckId: string) => Promise<void>
  clearDeckData: (deckId: string) => Promise<void>
  setDefaultDeck: (deckId: string) => Promise<void>

  saveCard: (draft: CardDraft, cardId?: string) => Promise<void>
  updateCard: (card: Card, patch: Partial<Card>) => Promise<void>
  deleteCard: (cardId: string) => Promise<void>
  reviewCard: (card: Card, grade: ReviewGrade) => Promise<void>
  recordTestAnswer: (card: Card, isCorrect: boolean) => Promise<void>
  saveTestResult: (testType: TestType, score: number, total: number) => Promise<void>

  updateSettings: (patch: Partial<AppSettings>) => Promise<void>
  importJson: (file: File, targetDeckId?: string) => Promise<void>
  exportJson: () => Promise<void>
  exportJsonTemplate: () => void
  exportCsvTemplate: () => void
  resetApp: () => Promise<void>
}

export const useAppStore = create<AppStore>((set, get) => ({
  isReady: false,
  currentView: 'study',
  decks: [],
  cards: [],
  allCards: [],
  testResults: [],

  async loadData() {
    const defaultDeck = await deckService.ensureDefaultDeck()
    const settings = await settingsService.getOrCreate()
    const decks = await deckService.getDecks()
    const activeDeckId = settings.activeDeckId && decks.some((deck) => deck.id === settings.activeDeckId)
      ? settings.activeDeckId
      : settings.defaultDeckId && decks.some((deck) => deck.id === settings.defaultDeckId)
        ? settings.defaultDeckId
        : defaultDeck.id

    if (settings.activeDeckId !== activeDeckId || !settings.defaultDeckId) {
      await settingsService.update({
        activeDeckId,
        defaultDeckId: settings.defaultDeckId || defaultDeck.id,
      })
    }

    const [cards, allCards, testResults, nextSettings] = await Promise.all([
      cardService.getCardsByDeck(activeDeckId),
      cardService.getCards(),
      testService.getResults(),
      settingsService.getOrCreate(),
    ])

    set({
      isReady: true,
      decks,
      cards,
      allCards,
      testResults,
      settings: nextSettings,
      activeDeckId,
    })
  },

  setView(view) {
    set({ currentView: view })
  },

  openEditor(cardId) {
    set({ currentView: 'editor', editingCardId: cardId })
  },

  showToast(message, kind = 'success') {
    set({ toast: { message, kind } })
  },

  clearToast() {
    set({ toast: undefined })
  },

  async setActiveDeck(deckId) {
    const settings = await settingsService.update({ activeDeckId: deckId })
    const cards = await cardService.getCardsByDeck(deckId)
    set({ activeDeckId: deckId, settings, cards, currentView: 'study' })
  },

  async createDeck(name, description, color) {
    const deck = await deckService.createDeck({ name, description, color })
    await get().loadData()
    await get().setActiveDeck(deck.id)
    get().showToast('Deck created.')
  },

  async updateDeck(deck, patch) {
    await deckService.updateDeck(deck, patch)
    await get().loadData()
    get().showToast('Deck updated.')
  },

  async deleteDeck(deckId) {
    await deckService.deleteDeck(deckId)
    await get().loadData()
    const deck = get().decks[0]
    if (deck) await get().setActiveDeck(deck.id)
    get().showToast('Deck deleted.')
  },

  async clearDeckData(deckId) {
    await deckService.clearDeckData(deckId)
    await get().loadData()
    get().showToast('Deck data cleared.')
  },

  async setDefaultDeck(deckId) {
    await deckService.setDefault(deckId)
    const settings = await settingsService.update({ defaultDeckId: deckId, activeDeckId: deckId })
    const cards = await cardService.getCardsByDeck(deckId)
    await get().loadData()
    set({ settings, activeDeckId: deckId, cards })
    get().showToast('Default deck updated.')
  },

  async saveCard(draft, cardId) {
    const existing = cardId ? get().allCards.find((card) => card.id === cardId) : undefined
    if (existing) {
      await cardService.updateCard(existing, draft)
      get().showToast('Card saved.')
    } else {
      await cardService.createCard(draft)
      get().showToast('Card created.')
    }
    await get().loadData()
    set({ currentView: 'cards', editingCardId: undefined })
  },

  async updateCard(card, patch) {
    await cardService.updateCard(card, patch)
    await get().loadData()
  },

  async deleteCard(cardId) {
    await cardService.deleteCard(cardId)
    await get().loadData()
    get().showToast('Card deleted.')
  },

  async reviewCard(card, grade) {
    await reviewService.review(card, grade)
    await get().loadData()
  },

  async recordTestAnswer(card, isCorrect) {
    await testService.recordAnswer(card, isCorrect)
    await get().loadData()
  },

  async saveTestResult(testType, score, total) {
    const deckId = get().activeDeckId
    if (!deckId) return
    await testService.saveResult(deckId, testType, score, total)
    await get().loadData()
  },

  async updateSettings(patch) {
    const settings = await settingsService.update(patch)
    set({ settings })
    get().showToast('Settings saved.')
  },

  async exportJson() {
    await importExportService.exportJson()
    get().showToast('Export downloaded.')
  },

  async importJson(file, targetDeckId) {
    const deckId = targetDeckId || get().activeDeckId
    await importExportService.importFile(file, deckId)
    await get().loadData()
    const targetDeck = get().decks.find((deck) => deck.id === deckId)
    get().showToast(file.name.toLowerCase().endsWith('.csv') && targetDeck ? `CSV imported to ${targetDeck.name}.` : 'Import complete.')
  },

  exportJsonTemplate() {
    importExportService.exportJsonTemplate()
    get().showToast('JSON template downloaded.')
  },

  exportCsvTemplate() {
    importExportService.exportCsvTemplate()
    get().showToast('CSV template downloaded.')
  },

  async resetApp() {
    await importExportService.reset()
    await get().loadData()
    set({ currentView: 'study' })
    get().showToast('MemoRing reset.')
  },
}))
