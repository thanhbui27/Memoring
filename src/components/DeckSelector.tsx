import { ChevronDown } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

export function DeckSelector() {
  const decks = useAppStore((state) => state.decks)
  const activeDeckId = useAppStore((state) => state.activeDeckId)
  const setActiveDeck = useAppStore((state) => state.setActiveDeck)

  return (
    <label className="relative block min-w-0">
      <span className="sr-only">Active deck</span>
      <select
        className="input appearance-none pr-10 text-sm font-bold"
        value={activeDeckId || ''}
        onChange={(event) => void setActiveDeck(event.target.value)}
      >
        {decks.map((deck) => (
          <option key={deck.id} value={deck.id}>
            {deck.isDefault ? 'Default - ' : ''}{deck.name}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" size={18} />
    </label>
  )
}
