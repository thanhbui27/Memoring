import { Check, Headphones, Keyboard, ListChecks, RotateCcw, Send, Volume2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { speechService } from '../services/speechService'
import { useAppStore } from '../store/useAppStore'
import type { Card } from '../types/card'
import type { TestType } from '../types/test'
import { shuffle } from '../utils/shuffle'

const testTypes: Array<{ type: TestType; label: string; icon: typeof ListChecks }> = [
  { type: 'multiple-choice', label: 'Multiple Choice', icon: ListChecks },
  { type: 'typing', label: 'Type Answer', icon: Keyboard },
  { type: 'self-check', label: 'Self Check', icon: Check },
  { type: 'listening', label: 'Listening', icon: Headphones },
]

const countOptions = [5, 10, 20, 0]

type Question = {
  card: Card
  options: string[]
}

export function QuickTest() {
  const cards = useAppStore((state) => state.cards)
  const settings = useAppStore((state) => state.settings)
  const recordTestAnswer = useAppStore((state) => state.recordTestAnswer)
  const saveTestResult = useAppStore((state) => state.saveTestResult)
  const [type, setType] = useState<TestType>('multiple-choice')
  const [questionCount, setQuestionCount] = useState(5)
  const [questions, setQuestions] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | undefined>()
  const [showBack, setShowBack] = useState(false)
  const [finished, setFinished] = useState(false)

  const usableCards = useMemo(
    () => cards.filter((card) => (card.frontText || card.frontDrawing) && (card.backText || card.backDrawing)),
    [cards],
  )
  const minimumCards = type === 'multiple-choice' ? 4 : 1

  const start = () => {
    const selected = shuffle(usableCards).slice(0, questionCount || usableCards.length)
    const nextQuestions = selected.map((card) => {
      const distractors = shuffle(usableCards.filter((item) => item.id !== card.id).map((item) => item.backText || 'Handwritten answer'))
        .slice(0, 3)
      return {
        card,
        options: shuffle([card.backText || 'Handwritten answer', ...distractors]).slice(0, 4),
      }
    })
    setQuestions(nextQuestions)
    setIndex(0)
    setScore(0)
    setAnswer('')
    setFeedback(undefined)
    setShowBack(false)
    setFinished(false)
    if (type === 'listening' && nextQuestions[0]) speechService.speak(nextQuestions[0].card.frontText, settings)
  }

  const current = questions[index]

  const next = async (isCorrect: boolean, delay = 0) => {
    if (!current) return
    if (type !== 'self-check') setFeedback(isCorrect ? 'correct' : 'wrong')
    await recordTestAnswer(current.card, isCorrect)
    setScore((value) => value + (isCorrect ? 1 : 0))

    window.setTimeout(() => {
      const nextIndex = index + 1
      if (nextIndex >= questions.length) {
        setFinished(true)
        void saveTestResult(type, score + (isCorrect ? 1 : 0), questions.length)
        return
      }
      setIndex(nextIndex)
      setAnswer('')
      setFeedback(undefined)
      setShowBack(false)
      if (type === 'listening') speechService.speak(questions[nextIndex].card.frontText, settings)
    }, delay)
  }

  const submitTyped = () => {
    const expected = (current?.card.backText || '').trim().toLowerCase()
    const actual = answer.trim().toLowerCase()
    const isCorrect = Boolean(expected) && expected === actual
    if (isCorrect) {
      void next(true, 700)
    } else {
      setFeedback('wrong')
    }
  }

  const submitListening = () => {
    const expected = (current?.card.frontText || '').trim().toLowerCase()
    const actual = answer.trim().toLowerCase()
    const isCorrect = Boolean(expected) && expected === actual
    if (isCorrect) {
      void next(true, 700)
    } else {
      setFeedback('wrong')
    }
  }

  if (usableCards.length < minimumCards) {
    return (
      <div className="panel mx-auto max-w-lg text-center">
        <h2 className="text-xl font-black">Quick Test needs cards</h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>Add at least {minimumCards} question and answer card{minimumCards > 1 ? 's' : ''} in this deck.</p>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="panel mx-auto max-w-lg text-center">
        <p className="chip mx-auto mb-3">Final score</p>
        <h2 className="text-5xl font-black">{score} / {questions.length}</h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>Wrong answers were marked as difficult for future review.</p>
        <button className="btn-primary mt-5" type="button" onClick={start}>
          <RotateCcw size={18} />
          Test again
        </button>
      </div>
    )
  }

  if (!current) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="panel space-y-4">
          <div>
            <span className="label">Test type</span>
            <div className="grid grid-cols-2 gap-2">
              {testTypes.map((item) => {
                const Icon = item.icon
                return (
                  <button key={item.type} className={type === item.type ? 'btn-primary is-active' : 'btn'} type="button" onClick={() => setType(item.type)}>
                    <Icon size={17} />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <span className="label">Questions</span>
            <div className="grid grid-cols-4 gap-2">
              {countOptions.map((option) => (
                <button key={option} className={questionCount === option ? 'btn-primary is-active' : 'btn'} type="button" onClick={() => setQuestionCount(option)}>
                  {option || 'All'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button className="btn-primary w-full" type="button" onClick={start}>Start Quick Test</button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="top-bar">
        <span className="chip">{index + 1} / {questions.length}</span>
        <span className="chip">Score {score}</span>
      </div>

      <div className="panel space-y-4">
        {type === 'listening' ? (
          <div className="text-center">
            <button className="btn-primary mx-auto h-16 w-16 p-0" type="button" onClick={() => speechService.speak(current.card.frontText, settings)} aria-label="Play listening prompt">
              <Volume2 size={26} />
            </button>
          </div>
        ) : (
          <h2 className="break-words text-center text-3xl font-black">{current.card.frontText || 'Handwritten question'}</h2>
        )}

        {current.card.frontDrawing && type !== 'listening' ? <img src={current.card.frontDrawing} className="mx-auto max-h-52 rounded-lg object-contain" alt="Question drawing" /> : null}

        {type === 'multiple-choice' ? (
          <div className="grid gap-2">
            {current.options.map((option) => (
              <button key={`${option}-${current.card.id}`} className="btn justify-start rounded-2xl text-left" type="button" onClick={() => void next(option === (current.card.backText || 'Handwritten answer'), 700)}>
                {option}
              </button>
            ))}
          </div>
        ) : null}

        {type === 'typing' ? (
          <div className="space-y-3">
            <input className="input" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Type the answer" />
            <button className="btn-primary w-full" type="button" onClick={submitTyped}>
              <Send size={18} />
              Submit
            </button>
          </div>
        ) : null}

        {type === 'listening' ? (
          <div className="space-y-3">
            <input className="input" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Type what you heard" />
            <button className="btn-primary w-full" type="button" onClick={submitListening}>
              <Send size={18} />
              Submit
            </button>
          </div>
        ) : null}

        {type === 'self-check' ? (
          <div className="space-y-3 text-center">
            {showBack ? (
              <div>
                <p className="text-2xl font-black">{current.card.backText || 'Handwritten answer'}</p>
                {current.card.backDrawing ? <img src={current.card.backDrawing} className="mx-auto mt-3 max-h-52 rounded-lg object-contain" alt="Answer drawing" /> : null}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button className="btn-danger" type="button" onClick={() => void next(false)}><X size={18} />Wrong</button>
                  <button className="btn-primary" type="button" onClick={() => void next(true)}><Check size={18} />Correct</button>
                </div>
              </div>
            ) : (
              <button className="btn-primary w-full" type="button" onClick={() => setShowBack(true)}>Flip answer</button>
            )}
          </div>
        ) : null}

        {feedback ? (
          <div className="rounded-2xl p-3 text-center text-sm font-bold" style={{ background: feedback === 'correct' ? '#dff5e7' : '#ffe0dc', color: feedback === 'correct' ? 'var(--good)' : 'var(--bad)' }}>
            {feedback === 'correct' ? 'Correct' : `Wrong. Correct answer: ${current.card.backText || current.card.frontText}`}
            {feedback === 'wrong' && (type === 'typing' || type === 'listening') ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className="btn min-h-9 px-3 py-1" type="button" onClick={() => void next(false)}>Count wrong</button>
                <button className="btn-primary min-h-9 px-3 py-1" type="button" onClick={() => void next(true)}>Mark correct</button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
