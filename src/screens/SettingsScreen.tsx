import { BarChart3, Download, FileJson, FileSpreadsheet, Link, Loader2, RotateCcw, Smartphone, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Modal } from '../components/Modal'
import { useAppStore } from '../store/useAppStore'
import type { AppTheme, SpeechRate } from '../types/settings'

const themes: AppTheme[] = ['cream', 'orange', 'dark', 'minimal']
const rates: SpeechRate[] = ['slow', 'normal', 'fast']

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const extractUrl = (value: string) => {
  const trimmed = value.trim()
  const markdownUrl = trimmed.match(/\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/i)?.[1]
  const plainUrl = trimmed.match(/https?:\/\/[^\s<>)]+/i)?.[0]
  return markdownUrl || plainUrl || trimmed
}

const resolveCsvUrl = (value: string) => {
  const extracted = extractUrl(value)
  if (!extracted) throw new Error('Paste a CSV link first.')

  let url: URL
  try {
    url = new URL(extracted)
  } catch {
    throw new Error('Paste a valid CSV, Google Sheets, or Google Drive link.')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('CSV link must start with http:// or https://.')
  }

  if (url.hostname === 'docs.google.com' && url.pathname.includes('/spreadsheets/d/')) {
    const spreadsheetId = url.pathname.match(/\/spreadsheets\/d\/([^/]+)/)?.[1]
    if (spreadsheetId) {
      const gidFromHash = url.hash.match(/gid=(\d+)/)?.[1]
      const gid = url.searchParams.get('gid') || gidFromHash || '0'
      return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`
    }
  }

  if (url.hostname === 'drive.google.com') {
    const fileId = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] || url.searchParams.get('id')
    if (fileId) {
      return `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download`
    }
  }

  return url.toString()
}

const shouldUseCsvProxy = (value: string) => {
  const hostname = new URL(value).hostname
  return hostname === 'docs.google.com' || hostname === 'drive.google.com' || hostname === 'drive.usercontent.google.com'
}

const readCsvError = async (response: Response) => {
  const text = await response.text()
  try {
    const payload = JSON.parse(text) as { error?: string }
    return payload.error || `CSV link returned ${response.status}.`
  } catch {
    return text.trim() || `CSV link returned ${response.status}.`
  }
}

const looksLikeSourceCode = (text: string) => {
  const preview = text.trim().slice(0, 500)
  return /^\s*(?:import|export)\s+/i.test(preview)
    || /^\s*(?:const|let|var|function|class)\s+[\w$]/i.test(preview)
    || /^\s*if\s*\(/i.test(preview)
    || /sourceMappingURL=/.test(preview)
}

const fetchCsvFromRequest = async (requestUrl: string, sourceUrl: string) => {
  let response: Response
  try {
    response = await fetch(requestUrl, { cache: 'no-store', credentials: 'omit', mode: 'cors', redirect: 'follow' })
  } catch {
    throw new Error('Browser blocked this CSV link. Try a public Google Drive or Google Sheets link.')
  }

  if (!response.ok) throw new Error(await readCsvError(response))
  const text = await response.text()
  if (/^\s*(<!doctype html|<html)/i.test(text)) {
    throw new Error('This link returned a web page instead of CSV. Check sharing or export settings.')
  }
  if (looksLikeSourceCode(text)) {
    throw new Error('This link returned app/source code instead of a MemoRing CSV file.')
  }

  return {
    text,
    responseUrl: response.url || sourceUrl,
  }
}

const fetchCsvText = async (url: string) => {
  if (shouldUseCsvProxy(url)) {
    return fetchCsvFromRequest(`/api/csv-proxy?url=${encodeURIComponent(url)}`, url)
  }

  return fetchCsvFromRequest(url, url)
}

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
  const [installHelpOpen, setInstallHelpOpen] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [csvUrl, setCsvUrl] = useState('')
  const [isImportingCsvUrl, setIsImportingCsvUrl] = useState(false)

  useEffect(() => {
    const fallbackDeckId = activeDeckId || settings?.defaultDeckId || decks[0]?.id || ''
    setImportDeckId((current) => current || fallbackDeckId)
  }, [activeDeckId, decks, settings?.defaultDeckId])

  useEffect(() => {
    const isStandalone = () => {
      const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean }
      return window.matchMedia('(display-mode: standalone)').matches || Boolean(navigatorWithStandalone.standalone)
    }

    setIsInstalled(isStandalone())

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
      useAppStore.getState().showToast('MemoRing installed.')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const installApp = async () => {
    if (isInstalled) {
      useAppStore.getState().showToast('MemoRing is already on this device.', 'info')
      return
    }

    if (!installPrompt) {
      setInstallHelpOpen(true)
      return
    }

    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    setInstallPrompt(null)
    useAppStore.getState().showToast(choice.outcome === 'accepted' ? 'MemoRing installed.' : 'Install dismissed.', choice.outcome === 'accepted' ? 'success' : 'info')
  }

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

  const importCsvFromUrl = async () => {
    try {
      setIsImportingCsvUrl(true)
      const url = resolveCsvUrl(csvUrl)
      const { text, responseUrl: fetchedUrl } = await fetchCsvText(url)
      const responseUrl = new URL(fetchedUrl)
      const responseFilename = decodeURIComponent(responseUrl.pathname.split('/').pop() || '')
      const fileName = responseFilename.toLowerCase().endsWith('.csv') ? responseFilename : 'memoring-link-import.csv'
      const file = new File([text], fileName, { type: 'text/csv' })
      await importJson(file, importDeckId)
      setCsvUrl('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import from link failed.'
      useAppStore.getState().showToast(message, 'error')
    } finally {
      setIsImportingCsvUrl(false)
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
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="label">App shortcut</span>
              <h2 className="text-lg font-black">Add to Home Screen</h2>
            </div>
            <button className={isInstalled ? 'btn-primary is-active shrink-0' : 'btn shrink-0'} type="button" onClick={() => void installApp()}>
              <Smartphone size={18} />
              {isInstalled ? 'Installed' : 'Install'}
            </button>
          </div>
          <p className="text-sm leading-6" style={{ color: 'var(--muted)' }}>
            Open MemoRing like a native app from your phone or desktop home screen.
          </p>
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
          <div className="space-y-2">
            <label>
              <span className="label">CSV link</span>
              <input
                className="input"
                type="url"
                value={csvUrl}
                onChange={(event) => setCsvUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void importCsvFromUrl()
                }}
                placeholder="https://example.com/cards.csv"
              />
            </label>
            <button className={isImportingCsvUrl ? 'btn-primary is-active w-full' : 'btn w-full'} type="button" onClick={() => void importCsvFromUrl()} disabled={isImportingCsvUrl}>
              {isImportingCsvUrl ? <Loader2 className="animate-spin" size={18} /> : <Link size={18} />}
              {isImportingCsvUrl ? 'Importing...' : 'Import CSV from link'}
            </button>
          </div>
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
      {installHelpOpen ? (
        <Modal title="Add to Home Screen" onClose={() => setInstallHelpOpen(false)}>
          <div className="space-y-3 text-sm leading-6" style={{ color: 'var(--muted)' }}>
            <p><strong style={{ color: 'var(--text)' }}>iPhone / iPad:</strong> tap Share, then Add to Home Screen.</p>
            <p><strong style={{ color: 'var(--text)' }}>Android Chrome:</strong> open the browser menu, then tap Install app or Add to Home screen.</p>
            <p><strong style={{ color: 'var(--text)' }}>Desktop:</strong> use the install icon in the address bar, or open the browser menu and choose Install app.</p>
          </div>
        </Modal>
      ) : null}
    </main>
  )
}
