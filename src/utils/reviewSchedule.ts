import type { Card, ReviewGrade } from '../types/card'
import { addDaysIso, nowIso } from './date'

export const getNextReviewAt = (grade: ReviewGrade) => {
  if (grade === 'again') return nowIso()
  if (grade === 'hard') return addDaysIso(1)
  if (grade === 'good') return addDaysIso(3)
  return addDaysIso(7)
}

export const applyReviewGrade = (card: Card, grade: ReviewGrade): Card => {
  const levelDelta = grade === 'again' ? -1 : grade === 'hard' ? 0 : grade === 'good' ? 1 : 2
  const isCorrect = grade === 'good' || grade === 'easy'

  return {
    ...card,
    correctCount: card.correctCount + (isCorrect ? 1 : 0),
    wrongCount: card.wrongCount + (isCorrect ? 0 : 1),
    reviewLevel: Math.max(0, card.reviewLevel + levelDelta),
    lastReviewedAt: nowIso(),
    nextReviewAt: getNextReviewAt(grade),
    updatedAt: nowIso(),
  }
}
