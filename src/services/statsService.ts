import type { Card } from '../types/card'
import type { Deck } from '../types/deck'
import type { TestResult } from '../types/test'
import { isDue, isToday } from '../utils/date'

export const statsService = {
  calculate(decks: Deck[], cards: Card[], testResults: TestResult[]) {
    const correctAnswers = cards.reduce((sum, card) => sum + card.correctCount, 0)
    const wrongAnswers = cards.reduce((sum, card) => sum + card.wrongCount, 0)
    const totalAnswers = correctAnswers + wrongAnswers
    const reviewedToday = cards.filter((card) => isToday(card.lastReviewedAt)).length
    const difficultCards = cards.filter((card) => card.wrongCount > card.correctCount || card.reviewLevel <= 0 && card.wrongCount > 0).length
    const dueToday = cards.filter((card) => isDue(card.nextReviewAt)).length
    const activeDays = new Set(testResults.concat([]).map((result) => result.createdAt.slice(0, 10)))
    cards.forEach((card) => {
      if (card.lastReviewedAt) activeDays.add(card.lastReviewedAt.slice(0, 10))
    })

    let streak = 0
    const cursor = new Date()
    for (;;) {
      const key = cursor.toISOString().slice(0, 10)
      if (!activeDays.has(key)) break
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
    }

    return {
      totalDecks: decks.length,
      totalCards: cards.length,
      reviewedToday,
      correctAnswers,
      wrongAnswers,
      accuracy: totalAnswers === 0 ? 0 : Math.round((correctAnswers / totalAnswers) * 100),
      currentStreak: streak,
      difficultCards,
      dueToday,
    }
  },
}
