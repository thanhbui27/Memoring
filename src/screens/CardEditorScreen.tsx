import { CardForm } from '../components/CardForm'
import { useAppStore } from '../store/useAppStore'

export function CardEditorScreen() {
  const activeDeckId = useAppStore((state) => state.activeDeckId)
  const editingCardId = useAppStore((state) => state.editingCardId)
  const allCards = useAppStore((state) => state.allCards)
  const setView = useAppStore((state) => state.setView)
  const card = allCards.find((item) => item.id === editingCardId)

  if (!activeDeckId) return null

  return (
    <main className="screen">
      <CardForm card={card} deckId={activeDeckId} onCancel={() => setView('cards')} />
    </main>
  )
}
