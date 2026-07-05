export type Card = {
  id: string
  deckId: string
  frontText?: string
  backText?: string
  exampleText?: string
  noteText?: string
  tag?: string
  color?: string
  isFavorite: boolean
  frontDrawing?: string
  backDrawing?: string
  correctCount: number
  wrongCount: number
  reviewLevel: number
  lastReviewedAt?: string
  nextReviewAt?: string
  createdAt: string
  updatedAt: string
}

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy'
