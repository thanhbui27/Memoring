import { DexieStorageProvider } from './DexieStorageProvider'
import type { StorageProvider } from './StorageProvider'

export const storageProvider: StorageProvider = new DexieStorageProvider()
