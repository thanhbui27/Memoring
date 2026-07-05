import { Save, X } from 'lucide-react'
import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { Card } from '../types/card'
import { HandwritingCanvas } from './HandwritingCanvas'

type CardFormProps = {
  card?: Card
  deckId: string
  onCancel: () => void
}

const colors = ['#fffdf6', '#ffe4b8', '#ffd6d6', '#dceefb', '#dcf6e8', '#ede3ff']

export function CardForm({ card, deckId, onCancel }: CardFormProps) {
  const saveCard = useAppStore((state) => state.saveCard)
  const [mode, setMode] = useState<'text' | 'handwriting'>('text')
  const [drawingSide, setDrawingSide] = useState<'front' | 'back'>('front')
  const [frontText, setFrontText] = useState(card?.frontText || '')
  const [backText, setBackText] = useState(card?.backText || '')
  const [exampleText, setExampleText] = useState(card?.exampleText || '')
  const [noteText, setNoteText] = useState(card?.noteText || '')
  const [tag, setTag] = useState(card?.tag || '')
  const [color, setColor] = useState(card?.color || colors[0])
  const [frontDrawing, setFrontDrawing] = useState(card?.frontDrawing)
  const [backDrawing, setBackDrawing] = useState(card?.backDrawing)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    void saveCard({
      deckId,
      frontText: frontText.trim(),
      backText: backText.trim(),
      exampleText: exampleText.trim(),
      noteText: noteText.trim(),
      tag: tag.trim(),
      color,
      frontDrawing,
      backDrawing,
    }, card?.id)
  }

  return (
    <form className="mx-auto max-w-2xl space-y-4" onSubmit={handleSubmit}>
      <div className="top-bar">
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--muted)' }}>{card ? 'Edit card' : 'New card'}</p>
          <h1 className="text-2xl font-black">Card Editor</h1>
        </div>
        <button className="btn-ghost h-11 w-11 p-0" type="button" onClick={onCancel} aria-label="Close editor">
          <X size={21} />
        </button>
      </div>

      <div className="panel space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-full p-1" style={{ background: 'var(--accent-soft)' }}>
          <button className={mode === 'text' ? 'btn-primary is-active' : 'btn border-transparent'} type="button" onClick={() => setMode('text')}>Text</button>
          <button className={mode === 'handwriting' ? 'btn-primary is-active' : 'btn border-transparent'} type="button" onClick={() => setMode('handwriting')}>Handwriting</button>
        </div>

        {mode === 'text' ? (
          <div className="space-y-3">
            <label>
              <span className="label">Front text</span>
              <textarea className="input min-h-28 resize-y" value={frontText} onChange={(event) => setFrontText(event.target.value)} placeholder="Question or vocabulary" />
            </label>
            <label>
              <span className="label">Back text</span>
              <textarea className="input min-h-28 resize-y" value={backText} onChange={(event) => setBackText(event.target.value)} placeholder="Answer or definition" />
            </label>
            <label>
              <span className="label">Example</span>
              <textarea className="input min-h-20 resize-y" value={exampleText} onChange={(event) => setExampleText(event.target.value)} />
            </label>
            <label>
              <span className="label">Note</span>
              <textarea className="input min-h-20 resize-y" value={noteText} onChange={(event) => setNoteText(event.target.value)} />
            </label>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button className={drawingSide === 'front' ? 'btn-primary is-active' : 'btn'} type="button" onClick={() => setDrawingSide('front')}>Front</button>
              <button className={drawingSide === 'back' ? 'btn-primary is-active' : 'btn'} type="button" onClick={() => setDrawingSide('back')}>Back</button>
            </div>
            <HandwritingCanvas
              value={drawingSide === 'front' ? frontDrawing : backDrawing}
              onChange={(value) => drawingSide === 'front' ? setFrontDrawing(value) : setBackDrawing(value)}
            />
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className="label">Tag</span>
            <input className="input" value={tag} onChange={(event) => setTag(event.target.value)} placeholder="grammar, verbs, exam..." />
          </label>
          <div>
            <span className="label">Card color</span>
            <div className="flex flex-wrap gap-2">
              {colors.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`h-11 w-11 rounded-full border-2 ${color === item ? 'scale-105' : ''}`}
                  style={{ background: item, borderColor: color === item ? 'var(--accent)' : 'var(--border)' }}
                  onClick={() => setColor(item)}
                  aria-label={`Use color ${item}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button className="btn" type="button" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" type="submit">
          <Save size={18} />
          Save
        </button>
      </div>
    </form>
  )
}
