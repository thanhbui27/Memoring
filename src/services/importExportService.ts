import { storageProvider } from '../storage/provider'
import type { MemoRingData } from '../storage/StorageProvider'
import type { Card } from '../types/card'
import type { Deck } from '../types/deck'
import { nowIso } from '../utils/date'
import { createId } from '../utils/id'

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const validateImport = (value: unknown): MemoRingData => {
  if (!isObject(value)) throw new Error('Import file must contain a JSON object.')

  const decks = value.decks
  const cards = value.cards
  const testResults = value.testResults

  if (!Array.isArray(decks) || !Array.isArray(cards) || !Array.isArray(testResults)) {
    throw new Error('Import file is missing decks, cards, or testResults arrays.')
  }

  for (const deck of decks) {
    if (!isObject(deck) || typeof deck.id !== 'string' || typeof deck.name !== 'string') {
      throw new Error('Import contains an invalid deck.')
    }
  }

  for (const card of cards) {
    if (!isObject(card) || typeof card.id !== 'string' || typeof card.deckId !== 'string') {
      throw new Error('Import contains an invalid card.')
    }
  }

  return value as MemoRingData
}

const downloadTextFile = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const csvHeaders = [
  'deckName',
  'frontText',
  'backText',
  'exampleText',
  'noteText',
  'tag',
  'color',
  'isFavorite',
  'frontDrawing',
  'backDrawing',
]

const escapeCsv = (value: string) => `"${value.replaceAll('"', '""')}"`

const requiredCsvHeaders = ['frontText', 'backText']

const normalizeHeader = (value: string) => value.trim().replace(/^\uFEFF/, '')

const csvHeaderAliases: Record<string, string[]> = {
  deckName: ['deckName', 'deck', 'deck name', 'desk', 'deskName'],
  frontText: ['frontText', 'front', 'front text', 'question', 'prompt', 'term', 'word', 'english'],
  backText: ['backText', 'back', 'back text', 'answer', 'definition', 'meaning', 'translation', 'vietnamese'],
  exampleText: ['exampleText', 'example', 'example text', 'sentence'],
  noteText: ['noteText', 'note', 'notes', 'note text'],
  tag: ['tag', 'tags'],
  color: ['color', 'colour'],
  isFavorite: ['isFavorite', 'favorite', 'favourite', 'starred'],
  frontDrawing: ['frontDrawing', 'front drawing'],
  backDrawing: ['backDrawing', 'back drawing'],
}

const normalizeHeaderToken = (value: string) =>
  normalizeHeader(value).toLowerCase().replace(/[^a-z0-9]/g, '')

const csvHeaderAliasMap = new Map(
  Object.entries(csvHeaderAliases).flatMap(([canonical, aliases]) =>
    aliases.map((alias) => [normalizeHeaderToken(alias), canonical] as const),
  ),
)

const canonicalHeader = (value: string) =>
  csvHeaderAliasMap.get(normalizeHeaderToken(value)) || normalizeHeader(value)

const looksLikeSourceCode = (text: string) => {
  const preview = text.trim().slice(0, 500)
  return /^\s*(?:import|export)\s+/i.test(preview)
    || /^\s*(?:const|let|var|function|class)\s+[\w$]/i.test(preview)
    || /^\s*if\s*\(/i.test(preview)
    || /sourceMappingURL=/.test(preview)
}

const parseCsv = (text: string, delimiter = ',') => {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]

    if (char === '"' && quoted && next === '"') {
      cell += '"'
      index += 1
      continue
    }

    if (char === '"') {
      quoted = !quoted
      continue
    }

    if (char === delimiter && !quoted) {
      row.push(cell)
      cell = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1
      row.push(cell)
      if (row.some((value) => value.trim())) rows.push(row)
      row = []
      cell = ''
      continue
    }

    cell += char
  }

  row.push(cell)
  if (row.some((value) => value.trim())) rows.push(row)
  return rows
}

const findHeaderIndex = (rows: string[][]) =>
  rows.findIndex((row) => {
    const headers = row.map(canonicalHeader)
    return requiredCsvHeaders.every((header) => headers.includes(header))
  })

const getHeaderMatchCount = (row: string[]) => {
  const headers = row.map(canonicalHeader)
  return requiredCsvHeaders.filter((header) => headers.includes(header)).length
}

const parseCsvWithHeader = (text: string) => {
  const separator = text.match(/^\uFEFF?\s*sep=(,|;|\t)\s*(?:\r?\n|$)/i)?.[1]
  const delimiters = separator ? [separator] : [',', ';', '\t']
  let bestRows: string[][] = []
  let bestHeaderIndex = 0
  let bestMatchCount = 0

  if (looksLikeSourceCode(text)) {
    throw new Error('This link returned app/source code instead of a MemoRing CSV file.')
  }

  for (const delimiter of delimiters) {
    const rows = parseCsv(text, delimiter)
    const headerIndex = findHeaderIndex(rows)
    if (headerIndex >= 0) {
      return rows.slice(headerIndex)
    }

    for (const [index, row] of rows.slice(0, 8).entries()) {
      const matchCount = getHeaderMatchCount(row)
      if (matchCount > bestMatchCount) {
        bestRows = rows
        bestHeaderIndex = index
        bestMatchCount = matchCount
      }
    }
  }

  const headers = (bestRows[bestHeaderIndex] || []).map(canonicalHeader).filter(Boolean)
  const missing = requiredCsvHeaders.filter((header) => !headers.includes(header))
  const found = headers.length > 0 ? ` Found headers: ${headers.slice(0, 6).join(', ')}.` : ''
  const preview = text.trim().replace(/\s+/g, ' ').slice(0, 120)
  const startsWith = !found && preview ? ` File starts with: ${preview}.` : ''
  throw new Error(`CSV template is missing: ${missing.join(', ')}.${found}${startsWith}`)
}

const csvBool = (value: string | undefined) => {
  const normalized = value?.trim().toLowerCase()
  return normalized === 'true' || normalized === 'yes' || normalized === '1'
}

const templateJson: MemoRingData = {
  decks: [
    {
      id: 'deck_template_english',
      name: 'English Vocabulary',
      description: 'Sample deck from MemoRing template',
      isDefault: true,
      color: '#f28c28',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  cards: [
    {
      id: 'card_template_hello',
      deckId: 'deck_template_english',
      frontText: 'Hello',
      backText: 'Xin chao',
      exampleText: 'Hello, nice to meet you.',
      noteText: 'Greeting',
      tag: 'basic',
      color: '#fffdf6',
      isFavorite: false,
      frontDrawing: '',
      backDrawing: '',
      correctCount: 0,
      wrongCount: 0,
      reviewLevel: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  testResults: [],
  settings: {
    id: 'app-settings',
    defaultDeckId: 'deck_template_english',
    activeDeckId: 'deck_template_english',
    speechRate: 'normal',
    speechLanguage: 'en-US',
    autoPronounce: false,
    theme: 'cream',
  },
}

export const importExportService = {
  async exportJson() {
    const data = await storageProvider.exportData()
    downloadTextFile(
      JSON.stringify(data, null, 2),
      `memoring-export-${new Date().toISOString().slice(0, 10)}.json`,
      'application/json',
    )
  },

  exportJsonTemplate() {
    downloadTextFile(
      JSON.stringify(templateJson, null, 2),
      'memoring-template.json',
      'application/json',
    )
  },

  exportCsvTemplate() {
    const rows = [
      csvHeaders,
      [
        'English Vocabulary',
        'Hello',
        'Xin chao',
        'Hello, nice to meet you.',
        'Greeting',
        'basic',
        '#fffdf6',
        'false',
        '',
        '',
      ],
      [
        'English Vocabulary',
        'Thank you',
        'Cam on',
        'Thank you for your help.',
        'Common phrase',
        'basic',
        '#ffe4b8',
        'true',
        '',
        '',
      ],
    ]

    downloadTextFile(
      rows.map((row) => row.map(escapeCsv).join(',')).join('\n'),
      'memoring-cards-template.csv',
      'text/csv',
    )
  },

  async importJson(file: File) {
    const text = await file.text()
    const data = validateImport(JSON.parse(text))
    await storageProvider.replaceData(data)
  },

  async importCsv(file: File, targetDeckId?: string) {
    const rows = parseCsvWithHeader(await file.text())
    if (rows.length < 2) throw new Error('CSV file needs a header row and at least one card row.')

    const headers = rows[0].map(canonicalHeader)
    const missing = requiredCsvHeaders.filter((header) => !headers.includes(header))
    if (missing.length > 0) throw new Error(`CSV template is missing: ${missing.join(', ')}.`)

    const existingDecks = await storageProvider.getDecks()
    const deckByName = new Map(existingDecks.map((deck) => [deck.name.trim().toLowerCase(), deck]))
    const targetDeck = targetDeckId ? existingDecks.find((deck) => deck.id === targetDeckId) : undefined
    const createdDecks: Deck[] = []
    const cards: Card[] = []

    const valueAt = (row: string[], key: string) => {
      const index = headers.indexOf(key)
      return index >= 0 ? row[index]?.trim() || '' : ''
    }

    for (const row of rows.slice(1)) {
      const frontText = valueAt(row, 'frontText')
      const backText = valueAt(row, 'backText')
      if (!frontText && !backText) continue

      const deckName = valueAt(row, 'deckName')
      let deck = targetDeck || (deckName ? deckByName.get(deckName.toLowerCase()) : undefined)

      if (!deck) {
        const now = nowIso()
        deck = {
          id: createId('deck'),
          name: deckName || 'Imported Cards',
          description: 'Imported from CSV',
          isDefault: existingDecks.length === 0 && createdDecks.length === 0,
          color: '#f28c28',
          createdAt: now,
          updatedAt: now,
        }
        deckByName.set(deck.name.trim().toLowerCase(), deck)
        createdDecks.push(deck)
      }

      const now = nowIso()
      cards.push({
        id: createId('card'),
        deckId: deck.id,
        frontText,
        backText,
        exampleText: valueAt(row, 'exampleText'),
        noteText: valueAt(row, 'noteText'),
        tag: valueAt(row, 'tag'),
        color: valueAt(row, 'color') || '#fffdf6',
        isFavorite: csvBool(valueAt(row, 'isFavorite')),
        frontDrawing: valueAt(row, 'frontDrawing'),
        backDrawing: valueAt(row, 'backDrawing'),
        correctCount: 0,
        wrongCount: 0,
        reviewLevel: 0,
        createdAt: now,
        updatedAt: now,
      })
    }

    if (cards.length === 0) throw new Error('CSV file does not contain any cards to import.')

    await Promise.all([
      ...createdDecks.map((deck) => storageProvider.saveDeck(deck)),
      ...cards.map((card) => storageProvider.saveCard(card)),
    ])

    return cards.length
  },

  async importFile(file: File, targetDeckId?: string) {
    const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv'
    if (isCsv) return this.importCsv(file, targetDeckId)
    await this.importJson(file)
    return undefined
  },

  async reset() {
    await storageProvider.reset()
  },
}
