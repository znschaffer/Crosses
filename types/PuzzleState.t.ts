import { Puzzle } from '@xwordly/xword-parser'

export interface PuzzleState {
  puzzle: Puzzle
  userAnswers: string[]
  currentIndex: number
  direction: 'across' | 'down'
  startedAt: string | null
  updatedAt: string | null
  complete: boolean
}
