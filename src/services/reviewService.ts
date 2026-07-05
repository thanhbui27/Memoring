import { storageProvider } from '../storage/provider'
import type { Card, ReviewGrade } from '../types/card'
import { applyReviewGrade } from '../utils/reviewSchedule'

export const reviewService = {
  async review(card: Card, grade: ReviewGrade) {
    const next = applyReviewGrade(card, grade)
    await storageProvider.saveCard(next)
    return next
  },
}
