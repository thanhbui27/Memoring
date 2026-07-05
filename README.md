# MemoRing

MemoRing is a mobile-first PWA flashcard notebook built with React, Vite, TypeScript, Tailwind CSS, Dexie/IndexedDB, Zustand, SpeechSynthesis, and Canvas handwriting.

## Features

- Physical ring-bound flashcard study screen on first launch
- Automatic default deck creation
- Deck create, rename, delete, select, and default marking
- Card create, edit, delete, search, filters, favorites, difficult card tracking
- Text and handwriting card editor with undo, clear, and saved image data URLs
- Browser text-to-speech with speed, language, and auto-pronounce settings
- Simple spaced repetition buttons: Again, Hard, Good, Easy
- Quick Test modes: multiple choice, type answer, self check, and listening
- Statistics for decks, cards, review activity, accuracy, streaks, difficult cards, and due cards
- JSON import/export, JSON/CSV import templates, CSV card import, and app reset
- Offline installable PWA with service worker and web manifest
- Backend-ready storage abstraction with a Dexie provider and API provider stub

## Setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Architecture

The UI talks to services, and services talk to the storage abstraction. Dexie is contained in `src/storage/DexieStorageProvider.ts`, so a backend can be added later by implementing `StorageProvider`.
