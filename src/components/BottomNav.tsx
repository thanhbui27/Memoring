import { BookOpen, Layers3, Library, Settings, Trophy } from 'lucide-react'
import type { AppView } from '../store/useAppStore'
import { useAppStore } from '../store/useAppStore'

const navItems: Array<{ view: AppView; label: string; icon: typeof BookOpen }> = [
  { view: 'study', label: 'Study', icon: BookOpen },
  { view: 'decks', label: 'Decks', icon: Library },
  { view: 'cards', label: 'Cards', icon: Layers3 },
  { view: 'test', label: 'Test', icon: Trophy },
  { view: 'settings', label: 'Settings', icon: Settings },
]

export function BottomNav() {
  const currentView = useAppStore((state) => state.currentView)
  const setView = useAppStore((state) => state.setView)
  const active = currentView === 'editor' ? 'cards' : currentView === 'stats' ? 'settings' : currentView

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.view}
            type="button"
            className={`nav-item ${active === item.view ? 'active' : ''}`}
            onClick={() => setView(item.view)}
            aria-current={active === item.view ? 'page' : undefined}
          >
            <Icon size={21} />
            <span className="truncate">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
