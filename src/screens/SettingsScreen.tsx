import { BarChart3, Download, FileJson, FileSpreadsheet, RotateCcw, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useAppStore } from '../store/useAppStore'
import type { AppTheme, SpeechRate } from '../types/settings'

const themes: AppTheme[] = ['cream', 'orange', 'dark', 'minimal']
const rates: SpeechRate[] = ['slow', 'normal', 'fast']

export function SettingsScreen() {
  const decks = useAppStore((state) => state.decks)
  const activeDeckId = useAppStore((state) => state.activeDeckId)
  const settings = useAppStore((state) => state.settings)
  const updateSettings = useAppStore((state) => state.updateSettings)
  const setDefaultDeck = useAppStore((state) => state.setDefaultDeck)
  const exportJson = useAppStore((state) => state.exportJson)
  const exportJsonTemplate = useAppStore((state) => state.exportJsonTemplate)
  const exportCsvTemplate = useAppStore((state) => state.exportCsvTemplate)
  const importJson = useAppStore((state) => state.importJson)
  const resetApp = useAppStore((state) => state.resetApp)
  const setView = useAppStore((state) => state.setView)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [importDeckId, setImportDeckId] = useState('')

  useEffect(() => {
    const fallbackDeckId = activeDeckId || settings?.defaultDeckId || decks[0]?.id || ''
    setImportDeckId((current) => current || fallbackDeckId)
  }, [activeDeckId, decks, settings?.defaultDeckId])

  const importFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      await importJson(file, importDeckId)
    } catch (error) {
      useAppStore.getState().showToast(error instanceof Error ? error.message : 'Import failed.', 'error')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <main className="screen">
      <div className="top-bar">
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--muted)' }}>Preferences and data</p>
          <h1 className="text-2xl font-black">Settings</h1>
        </div>
        <button className="btn h-11 w-11 p-0" type="button" onClick={() => setView('stats')} aria-label="Open statistics">
          <BarChart3 size={21} />
        </button>
      </div>

      <div className="mx-auto max-w-2xl space-y-4">
        <section className="panel space-y-4">
          <label>
            <span className="label">Default deck</span>
            <select className="input" value={settings?.defaultDeckId || ''} onChange={(event) => void setDefaultDeck(event.target.value)}>
              {decks.map((deck) => <option key={deck.id} value={deck.id}>{deck.name}</option>)}
            </select>
          </label>

          <div>
            <span className="label">Speech speed</span>
            <div className="grid grid-cols-3 gap-2">
              {rates.map((rate) => (
                <button key={rate} className={settings?.speechRate === rate ? 'btn-primary is-active' : 'btn'} type="button" onClick={() => void updateSettings({ speechRate: rate })}>
                  {rate}
                </button>
              ))}
            </div>
          </div>

          <label>
            <span className="label">Speech language</span>
            <input className="input" value={settings?.speechLanguage || 'en-US'} onChange={(event) => void updateSettings({ speechLanguage: event.target.value })} placeholder="en-US" />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-2xl border p-3" style={{ borderColor: 'var(--border)' }}>
            <span className="font-bold">Auto-pronounce on card change</span>
            <input className="h-6 w-6 accent-orange-500" type="checkbox" checked={settings?.autoPronounce || false} onChange={(event) => void updateSettings({ autoPronounce: event.target.checked })} />
          </label>
        </section>

        <section className="panel">
          <span className="label">Theme</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {themes.map((theme) => (
              <button key={theme} className={settings?.theme === theme ? 'btn-primary is-active' : 'btn'} type="button" onClick={() => void updateSettings({ theme })}>
                {theme}
              </button>
            ))}
          </div>
        </section>

        <section className="panel space-y-3">
          <input ref={fileRef} className="hidden" type="file" accept="application/json,.json,text/csv,.csv" onChange={(event) => void importFile(event)} />
          <label>
            <span className="label">Import to deck</span>
            <select className="input" value={importDeckId} onChange={(event) => setImportDeckId(event.target.value)}>
              {decks.map((deck) => (
                <option key={deck.id} value={deck.id}>{deck.name}</option>
              ))}
            </select>
          </label>
          <button className="btn w-full" type="button" onClick={() => void exportJson()}>
            <Download size={18} />
            Export JSON
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn min-h-12 px-3" type="button" onClick={exportJsonTemplate}>
              <FileJson size={18} />
              JSON template
            </button>
            <button className="btn min-h-12 px-3" type="button" onClick={exportCsvTemplate}>
              <FileSpreadsheet size={18} />
              CSV template
            </button>
          </div>
          <button className="btn w-full" type="button" onClick={() => fileRef.current?.click()}>
            <Upload size={18} />
            Import JSON / CSV
          </button>
          <button
            className="btn-danger w-full"
            type="button"
            onClick={() => setResetOpen(true)}
          >
            <RotateCcw size={18} />
            Reset app data
          </button>
        </section>
      </div>
      <ConfirmDialog
        open={resetOpen}
        title="Reset MemoRing?"
        message="All decks, cards, settings, drawings, and test results will be deleted."
        confirmLabel="Reset"
        danger
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          void resetApp()
          setResetOpen(false)
        }}
      />
    </main>
  )
}
