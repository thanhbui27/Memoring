export type TestType = 'multiple-choice' | 'typing' | 'self-check' | 'listening'

export type TestResult = {
  id: string
  deckId: string
  testType: TestType
  score: number
  totalQuestions: number
  createdAt: string
}
