import type { MemoRingData, StorageProvider } from './StorageProvider'

const notConnected = async () => {
  throw new Error('ApiStorageProvider is a backend-ready placeholder and is not connected yet.')
}

export class ApiStorageProvider implements StorageProvider {
  getDecks = notConnected
  saveDeck = notConnected
  deleteDeck = notConnected
  getCards = notConnected
  getCardsByDeck = notConnected
  saveCard = notConnected
  deleteCard = notConnected
  deleteCardsByDeck = notConnected
  getTestResults = notConnected
  saveTestResult = notConnected
  deleteTestResultsByDeck = notConnected
  getSettings = notConnected
  saveSettings = notConnected
  exportData = notConnected
  replaceData = async (_data: MemoRingData) => notConnected()
  reset = notConnected
}
