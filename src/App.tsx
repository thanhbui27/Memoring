import { useEffect } from 'react'
import { BottomNav } from './components/BottomNav'
import { Toast } from './components/Toast'
import { useAppStore } from './store/useAppStore'
import { CardEditorScreen } from './screens/CardEditorScreen'
import { CardsScreen } from './screens/CardsScreen'
import { DecksScreen } from './screens/DecksScreen'
import { QuickTestScreen } from './screens/QuickTestScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { StatsScreen } from './screens/StatsScreen'
import { StudyScreen } from './screens/StudyScreen'

function App() {
  const isReady = useAppStore((state) => state.isReady)
  const view = useAppStore((state) => state.currentView)
  const loadData = useAppStore((state) => state.loadData)
  const settings = useAppStore((state) => state.settings)

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    document.documentElement.dataset.theme = settings?.theme || 'cream'
  }, [settings?.theme])

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <div className="ring-card" aria-live="polite">
          <div className="card-face shadow-paper px-8 py-20 text-center">
            <div className="ring-hole" />
            <h1 className="text-4xl font-black">MemoRing</h1>
            <p className="mt-3 font-semibold" style={{ color: 'var(--muted)' }}>Opening your flashcard stack...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      {view === 'study' ? <StudyScreen /> : null}
      {view === 'decks' ? <DecksScreen /> : null}
      {view === 'cards' ? <CardsScreen /> : null}
      {view === 'editor' ? <CardEditorScreen /> : null}
      {view === 'test' ? <QuickTestScreen /> : null}
      {view === 'settings' ? <SettingsScreen /> : null}
      {view === 'stats' ? <StatsScreen /> : null}
      <BottomNav />
      <Toast />
    </div>
  )
}

export default App
