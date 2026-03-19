import type { CrosswordJSON } from 'xd-crossword-tools'

export interface PuzzleState {
  puzzle: CrosswordJSON
  currentIndex: number
  direction: 'across' | 'down'
  startedAt: string
  updatedAt: string
  finishedAt: string | null
  complete: boolean
  userAnswers: string[]
}
