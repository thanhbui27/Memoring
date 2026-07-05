import { Plus, Shuffle, SkipBack, SkipForward, Volume2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { DeckSelector } from '../components/DeckSelector'
import { Flashcard } from '../components/Flashcard'
import { speechService } from '../services/speechService'
import { useAppStore } from '../store/useAppStore'
import type { ReviewGrade } from '../types/card'
import { shuffle } from '../utils/shuffle'

const reviews: Array<{ grade: ReviewGrade; label: string; className: string }> = [
  { grade: 'again', label: 'Again', className: 'btn-danger' },
  { grade: 'hard', label: 'Hard', className: 'btn' },
  { grade: 'good', label: 'Good', className: 'btn' },
  { grade: 'easy', label: 'Easy', className: 'btn-primary' },
]

const cycleSwapDelayMs = 640

export function StudyScreen() {
  const decks = useAppStore((state) => state.decks)
  const cards = useAppStore((state) => state.cards)
  const activeDeckId = useAppStore((state) => state.activeDeckId)
  const openEditor = useAppStore((state) => state.openEditor)
  const reviewCard = useAppStore((state) => state.reviewCard)
  const settings = useAppStore((state) => state.settings)
  const [order, setOrder] = useState<string[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [cycleDirection, setCycleDirection] = useState<'left' | 'right'>()
  const activeDeck = decks.find((deck) => deck.id === activeDeckId)
  const cardIds = cards.map((card) => card.id).join('|')

  useEffect(() => {
    setOrder(cards.map((card) => card.id))
    setIndex(0)
    setFlipped(false)
  }, [cardIds])

  const orderedCards = useMemo(
    () => order.map((id) => cards.find((card) => card.id === id)).filter(Boolean) as typeof cards,
    [cards, order],
  )
  const current = orderedCards[index]
  const nextCard = orderedCards.length > 1 ? orderedCards[(index + 1) % orderedCards.length] : undefined
  const previousCard = orderedCards.length > 1 ? orderedCards[(index - 1 + orderedCards.length) % orderedCards.length] : undefined

  useEffect(() => {
    if (settings?.autoPronounce && current?.frontText) speechService.speak(current.frontText, settings)
  }, [current?.id, current?.frontText, settings])

  const cycleTo = (direction: 'left' | 'right') => {
    if (cycleDirection || !orderedCards.length) return
    if (orderedCards.length === 1) {
      setFlipped(false)
      return
    }

    setFlipped(false)
    setCycleDirection(direction)
    window.setTimeout(() => {
      if (direction === 'left') {
        setIndex((value) => (value + 1) % orderedCards.length)
      } else {
        setIndex((value) => (value - 1 + orderedCards.length) % orderedCards.length)
      }
      setCycleDirection(undefined)
    }, cycleSwapDelayMs)
  }

  const handleShuffle = () => {
    setOrder(shuffle(cards.map((card) => card.id)))
    setIndex(0)
    setFlipped(false)
  }

  const handleReview = async (grade: ReviewGrade) => {
    if (!current) return
    await reviewCard(current, grade)
    cycleTo('left')
  }

  return (
    <main className="screen">
      <div className="top-bar">
        <div className="min-w-0">
          <p className="text-sm font-bold" style={{ color: 'var(--muted)' }}>Current deck</p>
          <h1 className="truncate text-2xl font-black">{activeDeck?.name || 'MemoRing'}</h1>
        </div>
        <div className="w-48 max-w-[48vw]">
          <DeckSelector />
        </div>
      </div>

      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 py-3">
        <div className="flex w-full max-w-md items-center justify-between px-2">
          <span className="chip">{orderedCards.length ? `${index + 1} / ${orderedCards.length}` : '0 / 0'}</span>
          <span className="chip">{current?.isFavorite ? 'Favorite' : current?.tag || 'Study'}</span>
        </div>

        <Flashcard
          card={current}
          nextCard={nextCard}
          previousCard={previousCard}
          flipped={flipped}
          cycleDirection={cycleDirection}
          onFlip={() => setFlipped((value) => !value)}
          onSwipeLeft={() => cycleTo('left')}
          onSwipeRight={() => cycleTo('right')}
          onSpeak={() => speechService.speak(current?.frontText, settings)}
        />

        <div className="grid w-full max-w-md grid-cols-5 gap-2">
          <button className="btn h-12 px-0" type="button" onClick={() => cycleTo('right')} aria-label="Previous card">
            <SkipBack size={19} />
          </button>
          <button className="btn h-12 px-0" type="button" onClick={() => cycleTo('left')} aria-label="Next card">
            <SkipForward size={19} />
          </button>
          <button className="btn h-12 px-0" type="button" onClick={handleShuffle} aria-label="Shuffle cards">
            <Shuffle size={19} />
          </button>
          <button className="btn h-12 px-0" type="button" onClick={() => speechService.speak(current?.exampleText || current?.frontText, settings)} aria-label="Speak example">
            <Volume2 size={19} />
          </button>
          <button className="btn-primary h-12 px-0" type="button" onClick={() => openEditor()} aria-label="Add card">
            <Plus size={20} />
          </button>
        </div>

        {current ? (
          <div className="grid w-full max-w-md grid-cols-4 gap-2">
            {reviews.map((review) => (
              <button key={review.grade} className={`${review.className} px-2`} type="button" onClick={() => void handleReview(review.grade)}>
                {review.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  )
}
