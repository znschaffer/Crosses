import { PuzzleState } from './PuzzleState.t'

export type Direction = 'across' | 'down'

export interface WordMap {
  acrossClue: (number | null)[][]
  downClue: (number | null)[][]
}

export interface CellState {
  letter: string
  isCorrect: boolean | null
}

export type Props = {
  puzzleState: PuzzleState
  onNavigateClue?: (clueNumber: number, direction: Direction) => void
}
