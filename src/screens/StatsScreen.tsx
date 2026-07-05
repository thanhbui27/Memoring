import { ArrowLeft, Brain, CalendarCheck, CheckCircle2, Flame, Layers3, Library, Target, XCircle } from 'lucide-react'
import { statsService } from '../services/statsService'
import { useAppStore } from '../store/useAppStore'

export function StatsScreen() {
  const decks = useAppStore((state) => state.decks)
  const allCards = useAppStore((state) => state.allCards)
  const testResults = useAppStore((state) => state.testResults)
  const setView = useAppStore((state) => state.setView)
  const stats = statsService.calculate(decks, allCards, testResults)

  const items = [
    { label: 'Total decks', value: stats.totalDecks, icon: Library },
    { label: 'Total cards', value: stats.totalCards, icon: Layers3 },
    { label: 'Reviewed today', value: stats.reviewedToday, icon: CalendarCheck },
    { label: 'Correct answers', value: stats.correctAnswers, icon: CheckCircle2 },
    { label: 'Wrong answers', value: stats.wrongAnswers, icon: XCircle },
    { label: 'Accuracy', value: `${stats.accuracy}%`, icon: Target },
    { label: 'Current streak', value: stats.currentStreak, icon: Flame },
    { label: 'Difficult cards', value: stats.difficultCards, icon: Brain },
    { label: 'Due today', value: stats.dueToday, icon: CalendarCheck },
  ]

  return (
    <main className="screen">
      <div className="top-bar">
        <button className="btn h-11 w-11 p-0" type="button" onClick={() => setView('settings')} aria-label="Back to settings">
          <ArrowLeft size={21} />
        </button>
        <div className="flex-1 text-right">
          <p className="text-sm font-bold" style={{ color: 'var(--muted)' }}>Learning pulse</p>
          <h1 className="text-2xl font-black">Statistics</h1>
        </div>
      </div>

      <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <article key={item.label} className="panel">
              <Icon size={22} color="var(--accent-strong)" />
              <p className="mt-3 text-3xl font-black">{item.value}</p>
              <p className="mt-1 text-sm font-bold" style={{ color: 'var(--muted)' }}>{item.label}</p>
            </article>
          )
        })}
      </div>
    </main>
  )
}
