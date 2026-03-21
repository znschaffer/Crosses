import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

import { getPuzzleId, parsePuzBuffer } from '@/contexts/PuzzleContext'
import { downloadNewYorkerPuzzle } from './newYorker'
import { syncPuzzle } from './puzzleSync'

export type SyncSources = {
  tny: boolean
}

export const DEFAULT_SYNC_SOURCES: SyncSources = {
  tny: false,
}

const SYNC_SOURCES_STORAGE_KEY = '@syncSources'
const TNY_LAST_SYNC_DAY_KEY = '@tnyLastAutoSyncDay'

function getTodayKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function loadSyncSources(): Promise<SyncSources> {
  try {
    const raw = await AsyncStorage.getItem(SYNC_SOURCES_STORAGE_KEY)
    if (!raw) {
      return DEFAULT_SYNC_SOURCES
    }

    const parsed = JSON.parse(raw) as Partial<SyncSources>
    return {
      tny: Boolean(parsed.tny),
    }
  } catch {
    return DEFAULT_SYNC_SOURCES
  }
}

export async function saveSyncSources(sources: SyncSources) {
  await AsyncStorage.setItem(SYNC_SOURCES_STORAGE_KEY, JSON.stringify(sources))
}

export async function shouldRunTnyAutoSyncToday() {
  if (__DEV__) {
    return true
  }

  const lastRunDay = await AsyncStorage.getItem(TNY_LAST_SYNC_DAY_KEY)
  return lastRunDay !== getTodayKey()
}

export async function markTnyAutoSyncRanToday() {
  await AsyncStorage.setItem(TNY_LAST_SYNC_DAY_KEY, getTodayKey())
}

type SyncRecentTnyOptions = {
  days?: number
  existingPuzzleIds: Set<string>
  loadPuzzleFile: (buffer: ArrayBuffer) => Promise<void>
}

export type SyncRecentTnyResult = {
  downloaded: number
  skippedExisting: number
  failed: number
}

export function formatSyncSummary(
  result: SyncRecentTnyResult,
  prefix = 'Sync complete'
) {
  return `${prefix}: ${result.downloaded} new, ${result.skippedExisting} existing, ${result.failed} failed.`
}

function getDateDaysAgo(daysAgo: number) {
  const dt = new Date()
  dt.setHours(0, 0, 0, 0)
  dt.setDate(dt.getDate() - daysAgo)
  return dt
}

async function getTnyPuzzleDataForDate(date: Date) {
  const proxyBaseUrl =
    process.env.EXPO_PUBLIC_TNY_PROXY_URL || 'http://localhost:8787'
  const useDevWebProxy = Platform.OS === 'web' && __DEV__

  if (useDevWebProxy) {
    return downloadNewYorkerPuzzle({ date, proxyBaseUrl })
  }

  if (Platform.OS === 'web') {
    // Web production currently goes through sync API, which supports latest only.
    return syncPuzzle({ source: 'tny' })
  }

  return downloadNewYorkerPuzzle({ date })
}

export async function syncRecentTnyPuzzles(
  options: SyncRecentTnyOptions
): Promise<SyncRecentTnyResult> {
  const days = options.days ?? 30
  const result: SyncRecentTnyResult = {
    downloaded: 0,
    skippedExisting: 0,
    failed: 0,
  }

  const runs = Platform.OS === 'web' && !__DEV__ ? 1 : days

  for (let i = 0; i < runs; i += 1) {
    try {
      const date = getDateDaysAgo(i)
      const buffer = await getTnyPuzzleDataForDate(date)
      const puzzleId = getPuzzleId(parsePuzBuffer(buffer))

      if (options.existingPuzzleIds.has(puzzleId)) {
        result.skippedExisting += 1
        continue
      }

      await options.loadPuzzleFile(buffer)
      options.existingPuzzleIds.add(puzzleId)
      result.downloaded += 1
    } catch (error) {
      console.warn('[Sync] Failed to fetch tny puzzle for day offset', i, error)
      result.failed += 1
    }
  }

  return result
}
