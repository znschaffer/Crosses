import { PuzzleState } from '@/types/PuzzleState.t'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { puzToXD, xdToJSON } from 'xd-crossword-tools'
import type { CrosswordJSON } from 'xd-crossword-tools'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from 'react'

// ─── Schema version ───────────────────────────────────────────────────────────
// Bump whenever the persisted shape changes — triggers a clean wipe on mismatch.
const SCHEMA_VERSION = 4
const SCHEMA_VERSION_KEY = '@puzzleSchemaVersion'
const SETTINGS_KEY = '@crossesSettings'

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getPuzzleId(puzzle: CrosswordJSON): string {
  const title = puzzle.meta?.title ?? ''
  const author = puzzle.meta?.author ?? ''
  const rows = puzzle.tiles?.length ?? 0
  const cols = puzzle.tiles?.[0]?.length ?? 0
  return `${title}::${author}::${rows}x${cols}`
}

/**
 * Parse a .puz ArrayBuffer into a CrosswordJSON.
 * xd-crossword-tools produces plain JSON objects — no class instances —
 * so the result survives JSON.stringify/parse safely.
 */
export function parsePuzBuffer(buffer: ArrayBuffer): CrosswordJSON {
  const bytes = new Uint8Array(buffer)
  const xd = puzToXD(bytes as unknown as Parameters<typeof puzToXD>[0])
  return xdToJSON(xd)
}

// ─── State / Actions ──────────────────────────────────────────────────────────
type Settings = {
  timerEnabled: boolean
  hintsEnabled: boolean
  autoCheckEnabled: boolean
}

type State = {
  puzzles: Record<string, PuzzleState>
  activePuzzleId: string | null
  loading: boolean
  settings: Settings
}

type Action =
  | { type: 'INIT_LIBRARY'; puzzles: Record<string, PuzzleState> }
  | { type: 'ADD_PUZZLE'; id: string; state: PuzzleState }
  | { type: 'SET_ACTIVE_PUZZLE'; id: string }
  | { type: 'UPDATE_ACTIVE_PUZZLE'; partial: Partial<PuzzleState> }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_SETTING'; partial: Partial<Settings> }

const initialState: State = {
  puzzles: {},
  activePuzzleId: null,
  loading: true,
  settings: {
    timerEnabled: true,
    autoCheckEnabled: false,
    hintsEnabled: false,
  },
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INIT_LIBRARY':
      return { ...state, puzzles: action.puzzles, loading: false }

    case 'ADD_PUZZLE':
      return {
        ...state,
        puzzles: { ...state.puzzles, [action.id]: action.state },
        activePuzzleId: action.id,
      }

    case 'SET_ACTIVE_PUZZLE':
      return { ...state, activePuzzleId: action.id }

    case 'SET_SETTING':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.partial,
        },
      }

    case 'UPDATE_ACTIVE_PUZZLE': {
      if (!state.activePuzzleId) return state
      const current = state.puzzles[state.activePuzzleId]
      if (!current) return state
      return {
        ...state,
        puzzles: {
          ...state.puzzles,
          [state.activePuzzleId]: {
            ...current,
            ...action.partial,
            updatedAt: new Date().toISOString(),
          },
        },
      }
    }

    case 'SET_LOADING':
      return { ...state, loading: action.loading }

    default:
      return state
  }
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

const STORAGE_KEY_PREFIX = '@puzzleProgress:'

function storageKey(puzzleId: string) {
  return `${STORAGE_KEY_PREFIX}${puzzleId}`
}

async function checkAndMigrateSchema(): Promise<void> {
  const stored = await AsyncStorage.getItem(SCHEMA_VERSION_KEY)
  const storedVersion = stored ? parseInt(stored, 10) : 0
  if (storedVersion !== SCHEMA_VERSION) {
    const keys = await AsyncStorage.getAllKeys()
    const puzzleKeys = keys.filter(
      (k) => k.startsWith(STORAGE_KEY_PREFIX) || k.startsWith('@puzzleState:')
    )
    if (puzzleKeys.length > 0) await AsyncStorage.multiRemove(puzzleKeys)
    await AsyncStorage.setItem(SCHEMA_VERSION_KEY, String(SCHEMA_VERSION))
    console.log(
      `[PuzzleContext] Schema v${storedVersion} → v${SCHEMA_VERSION}, cleared ${puzzleKeys.length} entries`
    )
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const PuzzleContext = createContext<{
  state: State
  activePuzzle: PuzzleState | null
  loadPuzzleFile: (buffer: ArrayBuffer) => Promise<void>
  setActivePuzzle: (id: string) => void
  updateActivePuzzle: (s: Partial<PuzzleState>) => void
  setSettings: (s: Partial<Settings>) => void
} | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export const PuzzleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Load persisted library on mount
  useEffect(() => {
    ;(async () => {
      try {
        await checkAndMigrateSchema()
        const keys = await AsyncStorage.getAllKeys()
        const puzzleKeys = keys.filter((k) => k.startsWith(STORAGE_KEY_PREFIX))
        if (puzzleKeys.length === 0) {
          dispatch({ type: 'INIT_LIBRARY', puzzles: {} })
          return
        }
        const pairs = await AsyncStorage.multiGet(puzzleKeys)
        const loaded: Record<string, PuzzleState> = {}
        pairs.forEach(([key, value]) => {
          if (!value) return
          try {
            const ps: PuzzleState = JSON.parse(value)
            if (!ps.puzzle) return
            loaded[key.replace(STORAGE_KEY_PREFIX, '')] = ps
          } catch {
            console.warn(`[PuzzleContext] Skipping corrupt entry "${key}"`)
          }
        })
        dispatch({ type: 'INIT_LIBRARY', puzzles: loaded })
      } catch (e) {
        console.error('[PuzzleContext] Failed to load library:', e)
        dispatch({ type: 'INIT_LIBRARY', puzzles: {} })
      }
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed) {
            dispatch({
              type: 'SET_SETTING',
              partial: parsed,
            })
          }
        }
      } catch (e) {
        console.warn('[PuzzleContext] Failed to load settings: ', e)
      }
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings))
      } catch (e) {
        console.warn('[PuzzleContext] Failed to save settings: ', e)
      }
    })()
  }, [state.settings])

  // Debounced persist — CrosswordJSON is plain JSON, safe to stringify
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!state.activePuzzleId) return
    const id = state.activePuzzleId
    const active = state.puzzles[id]
    if (!active) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      try {
        await AsyncStorage.setItem(storageKey(id), JSON.stringify(active))
      } catch (e) {
        console.warn('[PuzzleContext] Failed to save:', e)
      }
    }, 1000)
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
    }
  }, [state.puzzles, state.activePuzzleId])

  // ── Public API ──────────────────────────────────────────────────────────────

  const loadPuzzleFile = async (buffer: ArrayBuffer) => {
    let puzzle: CrosswordJSON
    try {
      puzzle = parsePuzBuffer(buffer)
    } catch (e) {
      console.error('[PuzzleContext] Failed to parse .puz file:', e)
      throw e
    }

    const id = getPuzzleId(puzzle)
    console.log('Puzzle loaded successfully:', puzzle.meta?.title)

    // Already in memory — just activate
    if (state.puzzles[id]) {
      dispatch({ type: 'SET_ACTIVE_PUZZLE', id })
      return
    }

    // Check AsyncStorage for a saved session
    try {
      const raw = await AsyncStorage.getItem(storageKey(id))
      if (raw) {
        const saved: PuzzleState = JSON.parse(raw)
        if (saved.puzzle) {
          dispatch({ type: 'ADD_PUZZLE', id, state: saved })
          return
        }
      }
    } catch {
      // Corrupt entry — fall through to fresh state
    }

    // Brand new puzzle
    const now = new Date().toISOString()
    const rows = puzzle.tiles.length
    const cols = puzzle.tiles[0]?.length ?? 0

    dispatch({
      type: 'ADD_PUZZLE',
      id,
      state: {
        puzzle,
        currentIndex: 0,
        direction: 'across',
        startedAt: now,
        updatedAt: now,
        activeMs: 0,
        focusStartedAt: null,
        finishedAt: null,
        complete: false,
        userAnswers: new Array(rows * cols).fill(''),
      },
    })
  }

  const setActivePuzzle = useCallback(
    (id: string) => dispatch({ type: 'SET_ACTIVE_PUZZLE', id }),
    [dispatch]
  )

  const updateActivePuzzle = useCallback(
    (partial: Partial<PuzzleState>) =>
      dispatch({ type: 'UPDATE_ACTIVE_PUZZLE', partial }),
    [dispatch]
  )

  const setSettings = useCallback(
    (partial: Partial<Settings>) =>
      dispatch({
        type: 'SET_SETTING',
        partial,
      }),
    [dispatch]
  )

  const activePuzzle = state.activePuzzleId
    ? (state.puzzles[state.activePuzzleId] ?? null)
    : null

  return (
    <PuzzleContext.Provider
      value={{
        state,
        activePuzzle,
        loadPuzzleFile,
        setActivePuzzle,
        updateActivePuzzle,
        setSettings,
      }}
    >
      {children}
    </PuzzleContext.Provider>
  )
}

export function usePuzzle() {
  const ctx = useContext(PuzzleContext)
  if (!ctx) throw new Error('usePuzzle must be used within a PuzzleProvider')
  return ctx
}
