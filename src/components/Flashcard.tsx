import { Volume2 } from 'lucide-react'
import type { Card } from '../types/card'
import { RingCard } from './RingCard'

type FlashcardProps = {
  card?: Card
  nextCard?: Card
  previousCard?: Card
  flipped: boolean
  cycleDirection?: 'left' | 'right'
  onFlip: () => void
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSpeak?: () => void
}

const SideContent = ({ label, text, drawing, note }: { label: string; text?: string; drawing?: string; note?: string }) => (
  <div className="card-content">
    <span className="chip self-start">{label}</span>
    <div className="card-body">
      {drawing ? <img src={drawing} className="card-drawing" alt={`${label} drawing`} /> : null}
      <p className="card-main-text">{text || 'Blank side'}</p>
      {note ? <p className="card-note">{note}</p> : null}
    </div>
  </div>
)

const cardPreview = (card?: Card) => card ? (
  <SideContent label={card.tag || 'Next'} text={card.frontText} drawing={card.frontDrawing} note={card.exampleText} />
) : undefined

export function Flashcard({ card, nextCard, previousCard, flipped, cycleDirection, onFlip, onSwipeLeft, onSwipeRight, onSpeak }: FlashcardProps) {
  if (!card) {
    return (
      <RingCard
        flipped={flipped}
        cycleDirection={cycleDirection}
        onClick={onFlip}
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={onSwipeRight}
        nextPreview={cardPreview(nextCard)}
        previousPreview={cardPreview(previousCard)}
        front={<SideContent label="MemoRing" text="No cards yet. Create your first MemoRing card." note="Use the add button below to start this deck." />}
        back={<SideContent label="Back" text="Your answer will live here." note="Text and handwriting are both supported." />}
      />
    )
  }

  return (
    <div className="relative">
      {onSpeak ? (
        <button className="btn-primary absolute right-4 top-4 z-20 h-11 w-11 p-0" type="button" onClick={onSpeak} aria-label="Speak card front">
          <Volume2 size={19} />
        </button>
      ) : null}
      <RingCard
        flipped={flipped}
        cycleDirection={cycleDirection}
        onClick={onFlip}
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={onSwipeRight}
        nextPreview={cardPreview(nextCard)}
        previousPreview={cardPreview(previousCard)}
        front={<SideContent label={card.tag || 'Front'} text={card.frontText} drawing={card.frontDrawing} note={card.exampleText} />}
        back={<SideContent label="Back" text={card.backText} drawing={card.backDrawing} note={card.noteText} />}
      />
    </div>
  )
}
