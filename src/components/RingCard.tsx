import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'

type RingCardProps = {
  flipped: boolean
  front: ReactNode
  back: ReactNode
  nextPreview?: ReactNode
  previousPreview?: ReactNode
  cycleDirection?: 'left' | 'right'
  onClick?: () => void
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
}

type DragState = {
  x: number
  y: number
  rotate: number
  dragging: boolean
  leaving: boolean
}

const restingDrag: DragState = {
  x: 0,
  y: 0,
  rotate: 0,
  dragging: false,
  leaving: false,
}

export function RingCard({ flipped, front, back, nextPreview, previousPreview, cycleDirection, onClick, onSwipeLeft, onSwipeRight }: RingCardProps) {
  const startRef = useRef({ x: 0, y: 0 })
  const movedRef = useRef(false)
  const draggingRef = useRef(false)
  const rafRef = useRef<number | undefined>(undefined)
  const latestDragRef = useRef(restingDrag)
  const [drag, setDrag] = useState(restingDrag)

  useEffect(() => () => {
    if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
  }, [])

  const scheduleDrag = (nextDrag: DragState) => {
    latestDragRef.current = nextDrag
    if (rafRef.current) return

    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = undefined
      setDrag(latestDragRef.current)
    })
  }

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    startRef.current = { x: event.clientX, y: event.clientY }
    movedRef.current = false
    draggingRef.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    scheduleDrag({ ...latestDragRef.current, dragging: true, leaving: false })
  }

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!draggingRef.current) return
    const x = event.clientX - startRef.current.x
    const y = event.clientY - startRef.current.y
    const width = event.currentTarget.getBoundingClientRect().width
    const xLimit = Math.max(150, width * 0.58)
    if (Math.abs(x) > 6 || Math.abs(y) > 6) movedRef.current = true

    scheduleDrag({
      x: Math.max(-xLimit, Math.min(xLimit, x)),
      y: Math.max(-72, Math.min(92, y)),
      rotate: Math.max(-42, Math.min(42, x / 5.5)),
      dragging: true,
      leaving: false,
    })
  }

  const finishDrag = (event: PointerEvent<HTMLButtonElement>) => {
    draggingRef.current = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const currentDrag = latestDragRef.current
    const width = event.currentTarget.getBoundingClientRect().width
    const swipeThreshold = Math.max(64, Math.min(96, width * 0.22))
    if (Math.abs(currentDrag.x) > swipeThreshold) {
      const direction = currentDrag.x < 0 ? -1 : 1
      scheduleDrag({ ...currentDrag, dragging: false, leaving: false })
      if (direction < 0) onSwipeLeft?.()
      if (direction > 0) onSwipeRight?.()
      window.setTimeout(() => scheduleDrag(restingDrag), 600)
      return
    }

    scheduleDrag(restingDrag)
  }

  const handleClick = () => {
    if (movedRef.current) {
      movedRef.current = false
      return
    }
    onClick?.()
  }

  const nextReveal = drag.x < 0 ? Math.min(1, Math.abs(drag.x) / 90) : 0
  const previousReveal = drag.x > 0 ? Math.min(1, Math.abs(drag.x) / 90) : 0

  const style = {
    '--drag-x': `${drag.x}px`,
    '--drag-y': `${drag.y}px`,
    '--drag-rotate': `${drag.rotate}deg`,
    '--drag-fold': `${Math.max(-34, Math.min(34, drag.x / -6.5))}deg`,
    '--pivot-drag-x': `${drag.x * 0.42}px`,
    '--pivot-drag-y': `${drag.y * 0.3}px`,
    '--curl-opacity': `${Math.min(1, Math.abs(drag.x) / 90)}`,
    '--next-x': `${2.4 - nextReveal * 2}rem`,
    '--next-y': `${1.25 - nextReveal * 1.1}rem`,
    '--next-rotate': `${5 - nextReveal * 5}deg`,
    '--next-scale': `${0.91 + nextReveal * 0.07}`,
    '--next-opacity': `${0.56 + nextReveal * 0.44}`,
    '--previous-x': `${-2.4 + previousReveal * 2}rem`,
    '--previous-y': `${1.35 - previousReveal * 1.1}rem`,
    '--previous-rotate': `${-5 + previousReveal * 5}deg`,
    '--previous-scale': `${0.9 + previousReveal * 0.08}`,
    '--previous-opacity': `${0.34 + previousReveal * 0.66}`,
  } as CSSProperties

  return (
    <button
      type="button"
      className={`ring-card block text-left ${drag.dragging ? 'is-dragging' : ''} ${drag.leaving ? 'is-leaving' : ''} ${cycleDirection === 'left' ? 'is-cycling-left' : ''} ${cycleDirection === 'right' ? 'is-cycling-right' : ''}`}
      style={style}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      aria-label="Flip flashcard"
    >
      {previousPreview ? (
        <div className="stack-card stack-card-previous" aria-hidden="true">
          {previousPreview}
        </div>
      ) : null}
      {nextPreview ? (
        <div className="stack-card stack-card-next" aria-hidden="true">
          {nextPreview}
        </div>
      ) : null}
      <div className="card-drag-shell">
        <div className={`card-inner ${flipped ? 'is-flipped' : ''}`}>
          <div className="card-face front shadow-paper">
            <div className="ring-hole" />
            {front}
          </div>
          <div className="card-face back shadow-paper">
            <div className="ring-hole" />
            {back}
          </div>
        </div>
        <div className="paper-curl" aria-hidden="true" />
      </div>
    </button>
  )
}
