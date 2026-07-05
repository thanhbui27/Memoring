import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit3, Heart, Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { DeckSelector } from '../components/DeckSelector'
import { EmptyState } from '../components/EmptyState'
import { useAppStore } from '../store/useAppStore'

const pageSize = 8

export function CardsScreen() {
  const cards = useAppStore((state) => state.cards)
  const openEditor = useAppStore((state) => state.openEditor)
  const updateCard = useAppStore((state) => state.updateCard)
  const deleteCard = useAppStore((state) => state.deleteCard)
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState('all')
  const [favoriteOnly, setFavoriteOnly] = useState(false)
  const [difficultOnly, setDifficultOnly] = useState(false)
  const [deletingCardId, setDeletingCardId] = useState<string>()
  const [page, setPage] = useState(1)

  const tags = useMemo(() => Array.from(new Set(cards.map((card) => card.tag).filter(Boolean))) as string[], [cards])
  const filtered = useMemo(() => cards.filter((card) => {
    const search = `${card.frontText || ''} ${card.backText || ''} ${card.exampleText || ''} ${card.noteText || ''}`.toLowerCase()
    const difficult = card.wrongCount > card.correctCount || (card.wrongCount > 0 && card.reviewLevel <= 0)
    return (!query || search.includes(query.toLowerCase()))
      && (tag === 'all' || card.tag === tag)
      && (!favoriteOnly || card.isFavorite)
      && (!difficultOnly || difficult)
  }), [cards, difficultOnly, favoriteOnly, query, tag])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageStart = (page - 1) * pageSize
  const visibleCards = filtered.slice(pageStart, pageStart + pageSize)
  const showingStart = filtered.length === 0 ? 0 : pageStart + 1
  const showingEnd = Math.min(filtered.length, pageStart + visibleCards.length)

  useEffect(() => {
    setPage(1)
  }, [difficultOnly, favoriteOnly, query, tag])

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages))
  }, [totalPages])

  return (
    <main className="screen">
      <div className="top-bar">
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--muted)' }}>Active deck cards</p>
          <h1 className="text-2xl font-black">Cards</h1>
        </div>
        <button className="btn-primary h-11 w-11 p-0" type="button" onClick={() => openEditor()} aria-label="Add card">
          <Plus size={21} />
        </button>
      </div>

      <div className="mx-auto max-w-3xl space-y-3">
        <DeckSelector />
        <div className="panel space-y-3">
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={18} />
            <input className="input pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cards" />
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <select className="input" value={tag} onChange={(event) => setTag(event.target.value)}>
              <option value="all">All tags</option>
              {tags.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <button className={favoriteOnly ? 'btn-primary is-active' : 'btn'} type="button" onClick={() => setFavoriteOnly((value) => !value)}>Favorites</button>
            <button className={difficultOnly ? 'btn-primary is-active' : 'btn'} type="button" onClick={() => setDifficultOnly((value) => !value)}>Difficult</button>
            <button className="btn" type="button" onClick={() => { setQuery(''); setTag('all'); setFavoriteOnly(false); setDifficultOnly(false) }}>Clear</button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No matching cards"
            description="Create a new MemoRing card or loosen the filters."
            action={<button className="btn-primary" type="button" onClick={() => openEditor()}><Plus size={18} />Add card</button>}
          />
        ) : null}

        {filtered.length > 0 ? (
          <div className="panel flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black">Card browser</p>
                <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  Showing {showingStart}-{showingEnd} of {filtered.length}
                </p>
              </div>
              <span className="chip">Page {page} / {totalPages}</span>
            </div>

            <div className="cards-browser-grid">
              {visibleCards.map((card) => (
                <article key={card.id} className="card-browser-item">
                  <button className="card-browser-main" type="button" onClick={() => openEditor(card.id)}>
                    <span className="card-browser-swatch" style={{ background: card.color || 'var(--paper)' }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black">{card.frontText || 'Handwritten front'}</span>
                      <span className="mt-0.5 block truncate text-xs font-semibold" style={{ color: 'var(--muted)' }}>{card.backText || 'Handwritten back'}</span>
                    </span>
                    {card.tag ? <span className="card-browser-tag">{card.tag}</span> : null}
                  </button>
                  <div className="card-browser-actions">
                    <button className={card.isFavorite ? 'btn-primary is-active h-10 w-10 p-0' : 'btn h-10 w-10 p-0'} type="button" onClick={() => void updateCard(card, { isFavorite: !card.isFavorite })} aria-label="Toggle favorite">
                      <Heart size={16} />
                    </button>
                    <button className="btn h-10 w-10 p-0" type="button" onClick={() => openEditor(card.id)} aria-label="Edit card">
                      <Edit3 size={16} />
                    </button>
                    <button className="btn-danger h-10 w-10 p-0" type="button" onClick={() => setDeletingCardId(card.id)} aria-label="Delete card">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-2">
              <button className="btn px-2" type="button" onClick={() => setPage(1)} disabled={page === 1} aria-label="First page">
                <ChevronsLeft size={17} />
              </button>
              <button className="btn px-2" type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} aria-label="Previous page">
                <ChevronLeft size={17} />
              </button>
              <button className="btn px-2" type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} aria-label="Next page">
                <ChevronRight size={17} />
              </button>
              <button className="btn px-2" type="button" onClick={() => setPage(totalPages)} disabled={page === totalPages} aria-label="Last page">
                <ChevronsRight size={17} />
              </button>
            </div>
          </div>
        ) : null}
      </div>
      <ConfirmDialog
        open={Boolean(deletingCardId)}
        title="Delete card?"
        message="This card will be removed from the active deck."
        confirmLabel="Delete"
        danger
        onCancel={() => setDeletingCardId(undefined)}
        onConfirm={() => {
          if (deletingCardId) void deleteCard(deletingCardId)
          setDeletingCardId(undefined)
        }}
      />
    </main>
  )
}
