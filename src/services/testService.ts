import { storageProvider } from '../storage/provider'
import type { Card } from '../types/card'
import type { TestResult, TestType } from '../types/test'
import { nowIso } from '../utils/date'
import { createId } from '../utils/id'

export const testService = {
  getResults() {
    return storageProvider.getTestResults()
  },

  async saveResult(deckId: string, testType: TestType, score: number, totalQuestions: number) {
    const result: TestResult = {
      id: createId('test'),
      deckId,
      testType,
      score,
      totalQuestions,
      createdAt: nowIso(),
    }
    await storageProvider.saveTestResult(result)
    return result
  },

  async recordAnswer(card: Card, isCorrect: boolean) {
    await storageProvider.saveCard({
      ...card,
      correctCount: card.correctCount + (isCorrect ? 1 : 0),
      wrongCount: card.wrongCount + (isCorrect ? 0 : 1),
      reviewLevel: Math.max(0, card.reviewLevel + (isCorrect ? 1 : -1)),
      lastReviewedAt: nowIso(),
      updatedAt: nowIso(),
    })
  },
}
