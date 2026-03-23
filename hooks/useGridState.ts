import { CellState, Direction, WordMap } from '@/types/Grid.t'
import {
  advanceInWord,
  buildWordMap,
  checkComplete,
  getGridDimensions,
  getTileLetter,
  getWordIndices,
  indexToRC,
  isBlank,
  retreatSelection,
} from '@/utils/gridUtils'
import { useCallback, useMemo, useReducer } from 'react'
import { CrosswordJSON } from 'xd-crossword-tools'

export interface GridState {
  cellStates: CellState[]
  selectedIndex: number
  selectedDirection: Direction
  isPuzzleComplete: boolean
}

type GridAction =
  | { type: 'ENTER_LETTER'; letter: string }
  | { type: 'BACKSPACE' }
  | { type: 'SELECT_CELL'; index: number }
  | { type: 'TOGGLE_DIRECTION' }
  | { type: 'NAVIGATE_TO_CLUE'; index: number; direction: Direction }
  | { type: 'SET_PUZZLE_COMPLETE'; complete: boolean }
  | { type: 'ARROW_MOVE'; row: number; col: number }
  | {
      type: 'RESET'
      cellStates: CellState[]
      selectedIndex: number
      selectedDirection: Direction
    }
function createReducer(
  puzzle: CrosswordJSON,
  wordMap: WordMap,
  width: number,
  height: number,
  total: number
) {
  return function reducer(state: GridState, action: GridAction): GridState {
    switch (action.type) {
      case 'SELECT_CELL': {
        const r = Math.floor(action.index / width)
        const c = action.index % width
        if (isBlank(puzzle, r, c)) return state
        if (action.index === state.selectedIndex) {
          const next = state.selectedDirection === 'across' ? 'down' : 'across'
          return { ...state, selectedDirection: next }
        }
        return { ...state, selectedIndex: action.index }
      }
      case 'SET_PUZZLE_COMPLETE': {
        return {
          ...state,
          isPuzzleComplete: action.complete,
        }
      }
      case 'TOGGLE_DIRECTION': {
        return {
          ...state,
          selectedDirection:
            state.selectedDirection === 'across' ? 'down' : 'across',
        }
      }
      case 'ARROW_MOVE': {
        const { row, col } = action
        if (row < 0 || row >= height || col < 0 || col >= width) return state
        if (isBlank(puzzle, row, col)) return state
        return { ...state, selectedIndex: row * width + col }
      }
      case 'NAVIGATE_TO_CLUE': {
        return {
          ...state,
          selectedIndex: action.index,
          selectedDirection: action.direction,
        }
      }

      case 'ENTER_LETTER': {
        const idx = state.selectedIndex
        const dir = state.selectedDirection

        const cellStates = state.cellStates.slice()

        const { r, c } = indexToRC(puzzle, idx)
        const isCellCorrect = action.letter === getTileLetter(puzzle, r, c)
        cellStates[idx] = { letter: action.letter, isCorrect: isCellCorrect }

        const isPuzzleComplete = checkComplete(cellStates, puzzle)

        let nextIndex = idx
        const inWord = advanceInWord(idx, dir, puzzle)
        if (inWord !== idx) {
          nextIndex = inWord
        } else {
          const currentClueNum =
            dir === 'across'
              ? wordMap.acrossClue[Math.floor(idx / width)][idx % width]
              : wordMap.downClue[Math.floor(idx / width)][idx % width]

          const clueList =
            dir === 'across' ? puzzle.clues?.across : puzzle.clues?.down

          if (clueList && currentClueNum !== null) {
            const currentIdx = clueList.findIndex(
              (c) => c.number === currentClueNum
            )
            const nextClue =
              currentIdx >= 0 && currentIdx < clueList.length - 1
                ? clueList[currentIdx + 1]
                : clueList[0]

            if (nextClue) {
              const nr = nextClue.position.index
              const nc = nextClue.position.col
              const wordCells = getWordIndices(nr, nc, dir, puzzle)
              nextIndex =
                wordCells.find((i) => !cellStates[i]?.letter) ?? wordCells[0]
            }
          }
        }

        return {
          ...state,
          cellStates,
          selectedIndex: nextIndex,
          isPuzzleComplete,
        }
      }

      case 'BACKSPACE': {
        const { nextIdx, shouldClear } = retreatSelection(
          state.selectedIndex,
          state.selectedDirection,
          state.cellStates,
          puzzle
        )
        const cellStates = state.cellStates.slice()
        if (shouldClear) {
          cellStates[nextIdx] = { letter: '', isCorrect: null }
        }
        return { ...state, cellStates, selectedIndex: nextIdx }
      }

      case 'RESET': {
        return {
          cellStates: action.cellStates,
          selectedIndex: action.selectedIndex,
          selectedDirection: action.selectedDirection,
          isPuzzleComplete: false,
        }
      }
      default:
        return state
    }
  }
}

export function useGridState(puzzle: CrosswordJSON, initialState: GridState) {
  const wordMap = useMemo(() => buildWordMap(puzzle), [puzzle])
  const { width, height } = getGridDimensions(puzzle)
  const total = width * height

  const reducer = useCallback(
    (state: GridState, action: GridAction) =>
      createReducer(puzzle, wordMap, width, height, total)(state, action),
    [puzzle, wordMap, width, height, total]
  )

  const [gridState, dispatch] = useReducer(reducer, initialState)

  return { gridState, dispatch, wordMap, width, height, total }
}
