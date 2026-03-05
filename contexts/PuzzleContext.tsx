import { PuzzleState } from '@/types/PuzzleState.t'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Puzzle } from '@xwordly/xword-parser'
import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from 'react'

// ─── Schema version ───────────────────────────────────────────────────────────
// Bump this whenever the persisted shape changes. On mismatch all stored
// puzzle progress is wiped and the user starts fresh — better than a crash.
const SCHEMA_VERSION = 3
const SCHEMA_VERSION_KEY = '@puzzleSchemaVersion'

// ─── Persisted shape (subset of PuzzleState — NO puzzle object) ───────────────
// We never serialise the Puzzle object itself because xword-parser's Cell
// instances don't survive JSON round-trips (class methods / getters are lost).
// Instead we store only the user's progress and re-attach the live Puzzle
// object from the in-memory registry when we need it.
interface PersistedProgress {
  userAnswers: string[]
  currentIndex: number
  direction: 'across' | 'down'
  startedAt: string
  updatedAt: string
  complete: boolean
}

// ─── In-memory puzzle registry ────────────────────────────────────────────────
// Maps puzzleId → the live Puzzle object (never persisted).
const puzzleRegistry = new Map<string, Puzzle>()

// ─── State / Actions ──────────────────────────────────────────────────────────

type State = {
  puzzles: Record<string, PuzzleState>
  activePuzzleId: string | null
  loading: boolean
}

type Action =
  | { type: 'INIT_LIBRARY'; puzzles: Record<string, PuzzleState> }
  | { type: 'ADD_PUZZLE'; id: string; state: PuzzleState }
  | { type: 'SET_ACTIVE_PUZZLE'; id: string }
  | { type: 'UPDATE_ACTIVE_PUZZLE'; partial: Partial<PuzzleState> }
  | { type: 'SET_LOADING'; loading: boolean }

const initialState: State = {
  puzzles: {},
  activePuzzleId: null,
  loading: true,
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

    case 'UPDATE_ACTIVE_PUZZLE': {
      if (!state.activePuzzleId) return state
      const current = state.puzzles[state.activePuzzleId]
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

function progressKey(puzzleId: string) {
  return `${STORAGE_KEY_PREFIX}${puzzleId}`
}

function progressToState(id: string, p: PersistedProgress): PuzzleState {
  const puzzle = puzzleRegistry.get(id)
  if (!puzzle) throw new Error(`No live puzzle registered for id "${id}"`)
  return { ...p, puzzle }
}

async function checkAndMigrateSchema(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(SCHEMA_VERSION_KEY)
  const storedVersion = stored ? parseInt(stored, 10) : 0

  if (storedVersion !== SCHEMA_VERSION) {
    // Wipe all puzzle progress keys
    const keys = await AsyncStorage.getAllKeys()
    const puzzleKeys = keys.filter(
      (k) => k.startsWith(STORAGE_KEY_PREFIX) || k.startsWith('@puzzleState:')
    )
    if (puzzleKeys.length > 0) await AsyncStorage.multiRemove(puzzleKeys)
    await AsyncStorage.setItem(SCHEMA_VERSION_KEY, String(SCHEMA_VERSION))
    console.log(
      `[PuzzleContext] Schema migrated ${storedVersion} → ${SCHEMA_VERSION}, cleared ${puzzleKeys.length} entries`
    )
    return true // wiped
  }
  return false
}

// ─── Context ──────────────────────────────────────────────────────────────────

const PuzzleContext = createContext<{
  state: State
  activePuzzle: PuzzleState | null
  loadPuzzleFile: (p: Puzzle) => Promise<void>
  setActivePuzzle: (id: string) => void
  updateActivePuzzle: (s: Partial<PuzzleState>) => void
} | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export const PuzzleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Load persisted progress on mount, after schema check
  useEffect(() => {
    const loadLibrary = async () => {
      try {
        await checkAndMigrateSchema()

        const keys = await AsyncStorage.getAllKeys()
        const puzzleKeys = keys.filter((k) => k.startsWith(STORAGE_KEY_PREFIX))

        if (puzzleKeys.length === 0) {
          dispatch({ type: 'INIT_LIBRARY', puzzles: {} })
          return
        }

        const keyValues = await AsyncStorage.multiGet(puzzleKeys)
        const loaded: Record<string, PuzzleState> = {}

        keyValues.forEach(([key, value]) => {
          if (!value) return
          const id = key.replace(STORAGE_KEY_PREFIX, '')
          // Only restore if the live puzzle is already registered (i.e. the
          // puzzle file was re-loaded by the app before we got here). If not,
          // we skip it — it'll be re-created when the user opens that puzzle.
          if (!puzzleRegistry.has(id)) return
          try {
            const progress: PersistedProgress = JSON.parse(value)
            loaded[id] = progressToState(id, progress)
          } catch {
            console.warn(`[PuzzleContext] Skipping corrupt entry for "${id}"`)
          }
        })

        dispatch({ type: 'INIT_LIBRARY', puzzles: loaded })
      } catch (e) {
        console.error('[PuzzleContext] Failed to load puzzle library:', e)
        dispatch({ type: 'INIT_LIBRARY', puzzles: {} })
      }
    }
    loadLibrary()
  }, [])

  // Debounced persist — only writes the progress fields, never the puzzle object
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!state.activePuzzleId) return
    const id = state.activePuzzleId
    const active = state.puzzles[id]
    if (!active) return

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const progress: PersistedProgress = {
          userAnswers: active.userAnswers ?? [],
          currentIndex: active.currentIndex ?? 0,
          direction: (active.direction as 'across' | 'down') ?? 'across',
          startedAt: active.startedAt ?? new Date().toISOString(),
          updatedAt: active.updatedAt ?? new Date().toISOString(),
          complete: active.complete ?? false,
        }
        await AsyncStorage.setItem(progressKey(id), JSON.stringify(progress))
      } catch (e) {
        console.warn('[PuzzleContext] Failed to save puzzle progress:', e)
      }
    }, 1000)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
    }
  }, [state.puzzles, state.activePuzzleId])

  // ── Public API ──────────────────────────────────────────────────────────────

  const loadPuzzleFile = async (puzzle: Puzzle) => {
    const puzzleId = puzzle.title ?? `Unnamed_${Date.now()}`

    // Always register the live Puzzle object so geometry is always fresh
    puzzleRegistry.set(puzzleId, puzzle)

    // If we already have progress for this puzzle, just re-attach the live
    // puzzle object (in case it was loaded before library hydration finished)
    // and set it active.
    if (state.puzzles[puzzleId]) {
      dispatch({
        type: 'UPDATE_ACTIVE_PUZZLE',
        partial: { puzzle },
      })
      dispatch({ type: 'SET_ACTIVE_PUZZLE', id: puzzleId })
      return
    }

    // Check AsyncStorage for saved progress from a previous session
    try {
      const raw = await AsyncStorage.getItem(progressKey(puzzleId))
      if (raw) {
        const progress: PersistedProgress = JSON.parse(raw)
        dispatch({
          type: 'ADD_PUZZLE',
          id: puzzleId,
          state: progressToState(puzzleId, progress),
        })
        return
      }
    } catch {
      // Corrupt entry — fall through to fresh state
    }

    // Brand new puzzle
    const now = new Date().toISOString()
    const totalCells = puzzle.grid.width * puzzle.grid.height

    dispatch({
      type: 'ADD_PUZZLE',
      id: puzzleId,
      state: {
        puzzle,
        currentIndex: 0,
        direction: 'across',
        startedAt: now,
        updatedAt: now,
        complete: false,
        userAnswers: new Array(totalCells).fill(''),
      },
    })
  }

  const setActivePuzzle = (id: string) => {
    dispatch({ type: 'SET_ACTIVE_PUZZLE', id })
  }

  const updateActivePuzzle = (partial: Partial<PuzzleState>) => {
    dispatch({ type: 'UPDATE_ACTIVE_PUZZLE', partial })
  }

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
