import { PuzzleState } from '@/types/PuzzleState.t'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Puzzle } from '@xwordly/xword-parser'
import React, { createContext, useContext, useEffect, useReducer } from 'react'

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
  loading: false,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INIT_LIBRARY': {
      return { ...state, puzzles: action.puzzles, loading: false }
    }
    case 'ADD_PUZZLE': {
      return {
        ...state,
        puzzles: {
          ...state.puzzles,
          [action.id]: action.state,
        },
        activePuzzleId: action.id,
      }
    }
    case 'SET_ACTIVE_PUZZLE': {
      return { ...state, activePuzzleId: action.id }
    }
    case 'UPDATE_ACTIVE_PUZZLE': {
      if (!state.activePuzzleId) return state

      const currentActive = state.puzzles[state.activePuzzleId]

      const updatedState = {
        ...currentActive,
        ...action.partial,
        updatedAt: new Date().toISOString(),
      }

      return {
        ...state,
        puzzles: {
          ...state.puzzles,
          [state.activePuzzleId]: updatedState,
        },
      }
    }
    case 'SET_LOADING': {
      return { ...state, loading: action.loading }
    }
    default:
      return state
  }
}

const PuzzleContext = createContext<{
  state: State
  activePuzzle: PuzzleState | null
  loadPuzzleFile: (p: Puzzle) => Promise<void>
  setActivePuzzle: (id: string) => void
  updateActivePuzzle: (s: Partial<PuzzleState>) => void
} | null>(null)

const STORAGE_KEY_PREFIX = '@puzzleState:'

function getStorageKey(puzzleId: string) {
  return `${STORAGE_KEY_PREFIX}${puzzleId}`
}

/**
 * Provider component that wraps the application (or a portion of it) to supply
 * the puzzle state, along with functions to mutate and persist that state.
 *
 * Automatically handles saving the current puzzle's progress to `AsyncStorage`
 * whenever the state updates.
 *
 */
export const PuzzleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    const loadLibrary = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys()
        const puzzleKeys = keys.filter((k) => k.startsWith(STORAGE_KEY_PREFIX))
        if (puzzleKeys.length === 0) {
          dispatch({ type: 'INIT_LIBRARY', puzzles: {} })
          return
        }

        const keyValues = await AsyncStorage.multiGet(puzzleKeys)
        const loadedPuzzles: Record<string, PuzzleState> = {}
        keyValues.forEach(([key, value]) => {
          if (value) {
            const puzzleId = key.replace(STORAGE_KEY_PREFIX, '')
            loadedPuzzles[puzzleId] = JSON.parse(value)
          }
        })

        dispatch({ type: 'INIT_LIBRARY', puzzles: loadedPuzzles })
      } catch (e) {
        console.error('Failed to load puzzle library: ', e)
        dispatch({ type: 'INIT_LIBRARY', puzzles: {} })
      }
    }
    loadLibrary()
  }, [])

  useEffect(() => {
    const saveActivePuzzle = async () => {
      if (!state.activePuzzleId) return

      const activeState = state.puzzles[state.activePuzzleId]
      try {
        await AsyncStorage.setItem(
          getStorageKey(state.activePuzzleId),
          JSON.stringify(activeState)
        )
      } catch (e) {
        console.warn('Failed to save active puzzle: ', e)
      }
    }
    saveActivePuzzle()
  }, [state.puzzles, state.activePuzzleId])

  const loadPuzzleFile = async (puzzle: Puzzle) => {
    const puzzleId = puzzle.title || `Unnamed_${Date.now()}`

    if (state.puzzles[puzzleId]) {
      dispatch({ type: 'SET_ACTIVE_PUZZLE', id: puzzleId })
      return
    }

    const now = new Date().toISOString()
    const totalCells = puzzle.grid.width * puzzle.grid.height

    const newState: PuzzleState = {
      puzzle: puzzle,
      currentIndex: 0,
      direction: 'across',
      startedAt: now,
      updatedAt: now,
      complete: false,
      userAnswers: new Array(totalCells).fill(''),
    }

    dispatch({ type: 'ADD_PUZZLE', id: puzzleId, state: newState })
  }

  const setActivePuzzle = (id: string) => {
    dispatch({ type: 'SET_ACTIVE_PUZZLE', id })
  }

  const updateActivePuzzle = (partial: Partial<PuzzleState>) => {
    dispatch({ type: 'UPDATE_ACTIVE_PUZZLE', partial })
  }

  const activePuzzle = state.activePuzzleId
    ? state.puzzles[state.activePuzzleId]
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
