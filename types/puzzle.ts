export type PuzzleCell = {
  row: number
  col: number
  solution: string
  value: string
  isBlock: boolean
  number?: number
}

export type PuzzleClue = {
  number: number
  clue: string
  answer?: string
}

export type PuzzleData = {
  width: number
  height: number
  cells: PuzzleCell[][]
  acrossClues: PuzzleClue[]
  downClues: PuzzleClue[]
  title?: string
  author?: string
}
