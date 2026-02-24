import { PuzzleState } from '@/types/PuzzleState.t'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Puzzle } from '@xwordly/xword-parser'
import React, { createContext, useContext, useEffect, useReducer } from 'react'

type State = {
  current: PuzzleState | null
  loading: boolean
}

type Action =
  | { type: 'SET_PUZZLE'; puzzle: Puzzle }
  | { type: 'UPDATE_STATE'; state: Partial<PuzzleState> }
  | { type: 'LOAD_SAVED'; state: PuzzleState | null }
  | { type: 'SET_LOADING'; loading: boolean }

const initialState: State = {
  current: null,
  loading: false,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_PUZZLE': {
      const now = new Date().toISOString()
      return {
        ...state,
        current: {
          puzzle: action.puzzle,
          currentIndex: 0,
          direction: 'across',
          startedAt: now,
          updatedAt: now,
          complete: false,
        },
      }
    }
    case 'UPDATE_STATE': {
      if (!state.current) return state
      const updated = {
        ...state.current,
        ...action.state,
        updatedAt: new Date().toISOString(),
      }
      return { ...state, current: updated }
    }
    case 'LOAD_SAVED': {
      return { ...state, current: action.state }
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
  setPuzzle: (p: Puzzle) => Promise<void>
  updateState: (s: Partial<PuzzleState>) => void
} | null>(null)

const STORAGE_KEY_PREFIX = '@puzzleState'

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
    const save = async () => {
      if (!state.current) return
      try {
        const key = getStorageKey(state.current.puzzle.title ?? '') // title not verified to exist, maybe create composite key or use puzzle filename
        await AsyncStorage.setItem(key, JSON.stringify(state.current))
      } catch (e) {
        console.warn('Failed to save: ', e)
      }
    }
    save()
  }, [state])

  const setPuzzle = async (puzzle: Puzzle) => {
    dispatch({ type: 'SET_LOADING', loading: true })
    try {
      const saved = await AsyncStorage.getItem(
        getStorageKey(puzzle.title ?? '')
      )
      if (saved) {
        const parsed: PuzzleState = JSON.parse(saved)
        dispatch({ type: 'LOAD_SAVED', state: parsed })
      } else {
        dispatch({ type: 'SET_PUZZLE', puzzle: puzzle })
      }
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false })
    }
  }

  const updateState = (partial: Partial<PuzzleState>) => {
    dispatch({ type: 'UPDATE_STATE', state: partial })
  }

  return (
    <PuzzleContext.Provider value={{ state, setPuzzle, updateState }}>
      {children}
    </PuzzleContext.Provider>
  )
}

export function usePuzzle() {
  const ctx = useContext(PuzzleContext)
  if (!ctx) throw new Error('usePuzzle must be used within a PuzzleProvider')
  return ctx
}
