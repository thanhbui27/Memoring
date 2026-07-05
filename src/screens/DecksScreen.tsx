import { CheckCircle2, Edit3, Eraser, Plus, Star, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Modal } from '../components/Modal'
import { useAppStore } from '../store/useAppStore'
import type { Deck } from '../types/deck'
import { isDue } from '../utils/date'

const deckColors = ['#f28c28', '#40798c', '#65a30d', '#c2410c', '#7c3aed', '#475569']

export function DecksScreen() {
  const decks = useAppStore((state) => state.decks)
  const allCards = useAppStore((state) => state.allCards)
  const activeDeckId = useAppStore((state) => state.activeDeckId)
  const createDeck = useAppStore((state) => state.createDeck)
  const updateDeck = useAppStore((state) => state.updateDeck)
  const deleteDeck = useAppStore((state) => state.deleteDeck)
  const clearDeckData = useAppStore((state) => state.clearDeckData)
  const setDefaultDeck = useAppStore((state) => state.setDefaultDeck)
  const setActiveDeck = useAppStore((state) => state.setActiveDeck)
  const [editing, setEditing] = useState<Deck | 'new' | undefined>()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(deckColors[0])
  const [deletingDeck, setDeletingDeck] = useState<Deck>()
  const [clearingDeck, setClearingDeck] = useState<Deck>()

  const counts = useMemo(() => {
    const map = new Map<string, { total: number; due: number; progress: number }>()
    decks.forEach((deck) => {
      const cards = allCards.filter((card) => card.deckId === deck.id)
      const reviewed = cards.filter((card) => card.lastReviewedAt).length
      map.set(deck.id, {
        total: cards.length,
        due: cards.filter((card) => isDue(card.nextReviewAt)).length,
        progress: cards.length ? Math.round((reviewed / cards.length) * 100) : 0,
      })
    })
    return map
  }, [allCards, decks])

  const openNew = () => {
    setEditing('new')
    setName('')
    setDescription('')
    setColor(deckColors[0])
  }

  const openEdit = (deck: Deck) => {
    setEditing(deck)
    setName(deck.name)
    setDescription(deck.description || '')
    setColor(deck.color || deckColors[0])
  }

  const close = () => setEditing(undefined)

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (editing === 'new') {
      await createDeck(name, description, color)
    } else if (editing) {
      await updateDeck(editing, { name, description, color })
    }
    close()
  }

  return (
    <main className="screen">
      <div className="top-bar">
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--muted)' }}>Notebook rings</p>
          <h1 className="text-2xl font-black">Decks</h1>
        </div>
        <button className="btn-primary h-11 w-11 p-0" type="button" onClick={openNew} aria-label="Create deck">
          <Plus size={21} />
        </button>
      </div>

      <div className="mx-auto grid max-w-3xl gap-3">
        {decks.map((deck) => {
          const count = counts.get(deck.id)
          return (
            <article key={deck.id} className="panel">
              <div className="flex gap-3">
                <button className="mt-1 h-10 w-10 shrink-0 rounded-full border-4" style={{ background: deck.color || 'var(--accent)', borderColor: deck.id === activeDeckId ? 'var(--accent-strong)' : 'var(--border)' }} type="button" onClick={() => void setActiveDeck(deck.id)} aria-label={`Select ${deck.name}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-lg font-black">{deck.name}</h2>
                    {deck.isDefault ? <span className="chip"><Star size={13} />Default</span> : null}
                  </div>
                  {deck.description ? <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>{deck.description}</p> : null}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                    <span className="chip justify-center">{count?.total || 0} cards</span>
                    <span className="chip justify-center">{count?.due || 0} due</span>
                    <span className="chip justify-center">{count?.progress || 0}%</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-5 gap-2">
                <button className={deck.id === activeDeckId ? 'btn is-active px-2' : 'btn px-2'} type="button" onClick={() => void setActiveDeck(deck.id)}><CheckCircle2 size={17} />Select</button>
                <button className={deck.isDefault ? 'btn is-active px-2' : 'btn px-2'} type="button" onClick={() => void setDefaultDeck(deck.id)}><Star size={17} />Default</button>
                <button className="btn px-2" type="button" onClick={() => openEdit(deck)} aria-label="Rename deck"><Edit3 size={17} /></button>
                <button className="btn px-2" type="button" onClick={() => setClearingDeck(deck)} aria-label="Clear deck data">
                  <Eraser size={17} />
                </button>
                <button
                  className="btn-danger px-2"
                  type="button"
                  onClick={() => setDeletingDeck(deck)}
                  aria-label="Delete deck"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {editing ? (
        <Modal title={editing === 'new' ? 'Create deck' : 'Edit deck'} onClose={close}>
          <form className="space-y-4" onSubmit={save}>
            <label>
              <span className="label">Deck name</span>
              <input className="input" value={name} onChange={(event) => setName(event.target.value)} autoFocus required />
            </label>
            <label>
              <span className="label">Description</span>
              <textarea className="input min-h-24" value={description} onChange={(event) => setDescription(event.target.value)} />
            </label>
            <div>
              <span className="label">Color</span>
              <div className="flex flex-wrap gap-2">
                {deckColors.map((item) => (
                  <button key={item} className="h-10 w-10 rounded-full border-2" style={{ background: item, borderColor: color === item ? 'var(--text)' : 'var(--border)' }} type="button" onClick={() => setColor(item)} aria-label={`Use deck color ${item}`} />
                ))}
              </div>
            </div>
            <button className="btn-primary w-full" type="submit">Save deck</button>
          </form>
        </Modal>
      ) : null}
      <ConfirmDialog
        open={Boolean(deletingDeck)}
        title="Delete deck?"
        message={deletingDeck ? `"${deletingDeck.name}" and all cards/test results inside it will be removed.` : ''}
        confirmLabel="Delete"
        danger
        onCancel={() => setDeletingDeck(undefined)}
        onConfirm={() => {
          if (deletingDeck) void deleteDeck(deletingDeck.id)
          setDeletingDeck(undefined)
        }}
      />
      <ConfirmDialog
        open={Boolean(clearingDeck)}
        title="Clear deck data?"
        message={clearingDeck ? `All cards and test results in "${clearingDeck.name}" will be removed, but the deck itself will stay.` : ''}
        confirmLabel="Clear"
        danger
        onCancel={() => setClearingDeck(undefined)}
        onConfirm={() => {
          if (clearingDeck) void clearDeckData(clearingDeck.id)
          setClearingDeck(undefined)
        }}
      />
    </main>
  )
}
