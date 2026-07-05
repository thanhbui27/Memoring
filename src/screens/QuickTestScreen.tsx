import { DeckSelector } from '../components/DeckSelector'
import { QuickTest } from '../components/QuickTest'

export function QuickTestScreen() {
  return (
    <main className="screen">
      <div className="top-bar">
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--muted)' }}>Fast recall</p>
          <h1 className="text-2xl font-black">Quick Test</h1>
        </div>
        <div className="w-48 max-w-[48vw]">
          <DeckSelector />
        </div>
      </div>
      <QuickTest />
    </main>
  )
}
