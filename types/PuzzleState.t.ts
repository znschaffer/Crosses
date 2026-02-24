import { Puzzle } from '@xwordly/xword-parser'

export interface PuzzleState {
  puzzle: Puzzle
  currentIndex: number
  direction: 'across' | 'down'
  startedAt: string | null
  updatedAt: string | null
  complete: boolean
}
