import { CellState, Direction, WordMap } from '@/types/Grid.t'
import { CrosswordJSON } from 'xd-crossword-tools'

export function getActiveClueNumber(
  idx: number,
  dir: Direction,
  puzzle: CrosswordJSON,
  wordMap: WordMap
): number | null {
  const { width } = getGridDimensions(puzzle)
  const r = Math.floor(idx / width)
  const c = idx % width
  return dir === 'across' ? wordMap.acrossClue[r][c] : wordMap.downClue[r][c]
}

export function isBlank(puzzle: CrosswordJSON, r: number, c: number): boolean {
  return puzzle.tiles[r]?.[c]?.type === 'blank'
}

export function getTileLetter(
  puzzle: CrosswordJSON,
  r: number,
  c: number
): string {
  const t = puzzle.tiles[r]?.[c]
  return t?.type === 'letter' ? t.letter : ''
}

export function getGridDimensions(puzzle: CrosswordJSON) {
  const height = puzzle.tiles.length
  const width = puzzle.tiles[0]?.length ?? 0
  return { width, height }
}

/**
 * Return all flat indices forming the word that contains (r, c) in direction dir.
 * Derived from black-cell geometry — consistent with how xd-crossword-tools lays
 * out tiles.
 */
export function getWordIndices(
  r: number,
  c: number,
  dir: Direction,
  puzzle: CrosswordJSON
): number[] {
  const { width, height } = getGridDimensions(puzzle)
  const result: number[] = []

  if (dir === 'across') {
    let start = c
    while (start > 0 && !isBlank(puzzle, r, start - 1)) start--
    let end = c
    while (end < width - 1 && !isBlank(puzzle, r, end + 1)) end++
    for (let cc = start; cc <= end; cc++) result.push(r * width + cc)
  } else {
    let start = r
    while (start > 0 && !isBlank(puzzle, start - 1, c)) start--
    let end = r
    while (end < height - 1 && !isBlank(puzzle, end + 1, c)) end++
    for (let rr = start; rr <= end; rr++) result.push(rr * width + c)
  }

  return result
}

export function advanceInWord(
  idx: number,
  dir: Direction,
  puzzle: CrosswordJSON
): number {
  const { width, height } = getGridDimensions(puzzle)
  const r = Math.floor(idx / width)
  const c = idx % width
  if (dir === 'across') {
    const nc = c + 1
    if (nc < width && !isBlank(puzzle, r, nc)) return r * width + nc
  } else {
    const nr = r + 1
    if (nr < height && !isBlank(puzzle, nr, c)) return nr * width + c
  }
  return idx
}

export function retreatInWord(
  idx: number,
  dir: Direction,
  puzzle: CrosswordJSON
): number {
  const { width } = getGridDimensions(puzzle)
  const r = Math.floor(idx / width)
  const c = idx % width
  if (dir === 'across') {
    const nc = c - 1
    if (nc >= 0 && !isBlank(puzzle, r, nc)) return r * width + nc
  } else {
    const nr = r - 1
    if (nr >= 0 && !isBlank(puzzle, nr, c)) return nr * width + c
  }
  return idx
}

export function retreatSelection(
  idx: number,
  dir: Direction,
  cellStates: CellState[],
  puzzle: CrosswordJSON
): { nextIdx: number; shouldClear: boolean } {
  // Case 1: current cell has a letter — erase in place
  if (cellStates[idx]?.letter) {
    return { nextIdx: idx, shouldClear: true }
  }

  // Case 2: step back within the word
  const within = retreatInWord(idx, dir, puzzle)
  if (within !== idx) {
    return { nextIdx: within, shouldClear: true }
  }

  // Case 3: at word start — jump to last cell of previous clue (by clue order)
  const clueList = dir === 'across' ? puzzle.clues?.across : puzzle.clues?.down
  if (!Array.isArray(clueList) || clueList.length === 0) {
    return { nextIdx: idx, shouldClear: false }
  }

  // Find which clue the current cell belongs to
  const currentClueIdx = clueList.findIndex((clue) => {
    const sr = clue.position.index
    const sc = clue.position.col
    const cells = getWordIndices(sr, sc, dir, puzzle)
    return cells.includes(idx)
  })

  // Jump to the last cell of the previous clue
  if (currentClueIdx > 0) {
    const prevClue = clueList[currentClueIdx - 1]
    const pr = prevClue.position.index
    const pc = prevClue.position.col
    const wordCells = getWordIndices(pr, pc, dir, puzzle)
    if (wordCells.length > 0) {
      return { nextIdx: wordCells[wordCells.length - 1], shouldClear: true }
    }
  }

  return { nextIdx: idx, shouldClear: false }
}

export function checkComplete(
  cellStates: CellState[],
  puzzle: CrosswordJSON
): boolean {
  const { width, height } = getGridDimensions(puzzle)
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (isBlank(puzzle, r, c)) continue
      const state = cellStates[r * width + c]
      const solution = getTileLetter(puzzle, r, c)
      if (!state?.letter || state.letter !== solution) return false
    }
  }
  return true
}

/**
 * Build lookup maps: acrossClue[r][c] and downClue[r][c] → clue number | null.
 */
export function buildWordMap(puzzle: CrosswordJSON): WordMap {
  const { width, height } = getGridDimensions(puzzle)

  const acrossClue: (number | null)[][] = Array.from({ length: height }, () =>
    new Array(width).fill(null)
  )
  const downClue: (number | null)[][] = Array.from({ length: height }, () =>
    new Array(width).fill(null)
  )

  for (const clue of puzzle.clues?.across ?? []) {
    const r = clue.position.index
    const c = clue.position.col
    for (let i = 0; i < clue.tiles.length; i++) {
      if (r < height && c + i < width) {
        acrossClue[r][c + i] = clue.number
      }
    }
  }

  for (const clue of puzzle.clues?.down ?? []) {
    const r = clue.position.index
    const c = clue.position.col
    for (let i = 0; i < clue.tiles.length; i++) {
      if (r + i < height && c < width) {
        downClue[r + i][c] = clue.number
      }
    }
  }

  return { acrossClue, downClue }
}
