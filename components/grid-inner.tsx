import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  useWindowDimensions,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native'
import type { Puzzle } from '@xwordly/xword-parser'
import { usePuzzle } from '@/contexts/PuzzleContext'
import { PuzzleState } from '@/types/PuzzleState.t'
import ClueBar from './cluebar'
import { useHeaderHeight } from '@react-navigation/elements'

// ─── Layout constants ────────────────────────────────────────────────────────
const GRID_PADDING = 8
const MIN_CELL_SIZE = 20
const MAX_CELL_SIZE = 64
const GRID_HEIGHT_FRACTION = 0.55
const HORIZONTAL_MARGIN = 32
const SYNC_DEBOUNCE_MS = 700

// ─── Colours ─────────────────────────────────────────────────────────────────
const COLOR = {
  black: '#1a1a1a',
  white: '#ffffff',
  border: '#444444',
  activeCellBg: '#f7da21', // selected cell — bright yellow (NYT-style)
  activeWordBg: '#a7d8f0', // rest of the active word — light blue
  circleBg: 'transparent',
  circleStroke: '#888888',
  correct: '#d4edda',
  incorrect: '#f8d7da',
  clueNum: '#333333',
  letterText: '#1a1a1a',
} as const

// ─── Types ───────────────────────────────────────────────────────────────────
type Direction = 'across' | 'down'

interface WordMap {
  // Maps every (r,c) → { acrossWord: number|null, downWord: number|null }
  // where the number is the clue number that starts the word
  acrossClue: (number | null)[][]
  downClue: (number | null)[][]
}

interface CellState {
  letter: string
  isCorrect: boolean | null // null = unchecked
}

type Props = {
  puzzleState: PuzzleState
  /** Jump to a specific clue number + direction from ClueBar navigation */
  onNavigateClue?: (clueNumber: number, direction: Direction) => void
}

// ─── Pre-compute helpers ──────────────────────────────────────────────────────

/**
 * Build lookup maps: acrossClue[r][c] and downClue[r][c] → clue number | null.
 *
 * cell.number in xword-parser is a sequential cell index (1, 2, 3...), NOT
 * the crossword clue number. The actual clue numbers live in
 * puzzle.clues.across[n].number / puzzle.clues.down[n].number.
 *
 * The .puz format stores clues as a flat list in reading order with no numbers
 * in the binary — xword-parser derives the numbers by walking the grid the
 * same way we do here. So we walk in identical reading order and consume the
 * next clue from each array at each word start, giving us the correct number.
 */
function buildWordMap(puzzle: Puzzle): WordMap {
  const { width, height, cells } = puzzle.grid

  const acrossClue: (number | null)[][] = Array.from({ length: height }, () =>
    new Array(width).fill(null)
  )
  const downClue: (number | null)[][] = Array.from({ length: height }, () =>
    new Array(width).fill(null)
  )

  const acrossClues = Array.isArray(puzzle.clues?.across)
    ? puzzle.clues.across
    : []
  const downClues = Array.isArray(puzzle.clues?.down) ? puzzle.clues.down : []
  let acrossIdx = 0
  let downIdx = 0

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (cells[r][c].isBlack) continue

      const startsAcross =
        (c === 0 || cells[r][c - 1].isBlack) &&
        c < width - 1 &&
        !cells[r][c + 1].isBlack

      const startsDown =
        (r === 0 || cells[r - 1][c].isBlack) &&
        r < height - 1 &&
        !cells[r + 1][c].isBlack

      // Both across and down can start at the same cell. Each pulls from its
      // own independent ordered list, so they don't interfere with each other.
      if (startsAcross && acrossIdx < acrossClues.length) {
        const num = acrossClues[acrossIdx].number
        acrossIdx++
        let cc = c
        while (cc < width && !cells[r][cc].isBlack) {
          acrossClue[r][cc] = num
          cc++
        }
      }

      if (startsDown && downIdx < downClues.length) {
        const num = downClues[downIdx].number
        downIdx++
        let rr = r
        while (rr < height && !cells[rr][c].isBlack) {
          downClue[rr][c] = num
          rr++
        }
      }
    }
  }

  return { acrossClue, downClue }
}

/**
 * Return the clue number for the word the selected cell belongs to.
 * Reads directly from the pre-computed wordMap — no geometry re-derivation.
 */
function getActiveClueNumber(
  idx: number,
  dir: Direction,
  puzzle: Puzzle,
  wordMap: WordMap
): number | null {
  const { width } = puzzle.grid
  const r = Math.floor(idx / width)
  const c = idx % width
  return dir === 'across' ? wordMap.acrossClue[r][c] : wordMap.downClue[r][c]
}

/**
 * Given a cell (r, c) and direction, return ALL flat indices that form that word.
 * Derived purely from black-cell geometry.
 */
function getWordIndices(
  r: number,
  c: number,
  dir: Direction,
  puzzle: Puzzle
): number[] {
  const { width, height, cells } = puzzle.grid
  const result: number[] = []

  if (dir === 'across') {
    let start = c
    while (start > 0 && !cells[r][start - 1].isBlack) start--
    let end = c
    while (end < width - 1 && !cells[r][end + 1].isBlack) end++
    for (let cc = start; cc <= end; cc++) result.push(r * width + cc)
  } else {
    let start = r
    while (start > 0 && !cells[start - 1][c].isBlack) start--
    let end = r
    while (end < height - 1 && !cells[end + 1][c].isBlack) end++
    for (let rr = start; rr <= end; rr++) result.push(rr * width + c)
  }

  return result
}

/**
 * Advance to the next white cell in the current word. If at the word boundary,
 * stay. Skips black cells.
 */
function advanceInWord(idx: number, dir: Direction, puzzle: Puzzle): number {
  const { width, height, cells } = puzzle.grid
  const r = Math.floor(idx / width)
  const c = idx % width

  if (dir === 'across') {
    const nc = c + 1
    if (nc < width && !cells[r][nc].isBlack) return r * width + nc
  } else {
    const nr = r + 1
    if (nr < height && !cells[nr][c].isBlack) return nr * width + c
  }
  return idx
}

/**
 * Retreat one cell within the current word. Returns same idx if at word start.
 */
function retreatInWord(idx: number, dir: Direction, puzzle: Puzzle): number {
  const { width, cells } = puzzle.grid
  const r = Math.floor(idx / width)
  const c = idx % width

  if (dir === 'across') {
    const nc = c - 1
    if (nc >= 0 && !cells[r][nc].isBlack) return r * width + nc
  } else {
    const nr = r - 1
    if (nr >= 0 && !cells[nr][c].isBlack) return nr * width + c
  }
  return idx
}

/**
 * Full backspace retreat:
 * 1. If current cell has a letter → stay, caller will clear it.
 * 2. If current cell is empty and not at word start → move back one cell.
 * 3. If at word start → jump to the last cell of the previous word (in reading
 *    order) that belongs to the same direction.
 *
 * Returns { nextIdx, shouldClear } where shouldClear means the target cell's
 * letter should be erased.
 */
function retreatSelection(
  idx: number,
  dir: Direction,
  cellStates: CellState[],
  puzzle: Puzzle
): { nextIdx: number; shouldClear: boolean } {
  const { width, height, cells } = puzzle.grid

  // Case 1: current cell has a letter — just erase in place
  if (cellStates[idx]?.letter) {
    return { nextIdx: idx, shouldClear: true }
  }

  // Case 2: try to step back within the same word
  const withinWord = retreatInWord(idx, dir, puzzle)
  if (withinWord !== idx) {
    return { nextIdx: withinWord, shouldClear: true }
  }

  // Case 3: at the start of a word — find the previous word in reading order
  // Scan backwards through all cells
  for (let probe = idx - 1; probe >= 0; probe--) {
    const pr = Math.floor(probe / width)
    const pc = probe % width
    if (cells[pr][pc].isBlack) continue

    const isWordEnd =
      dir === 'across'
        ? pc === width - 1 || cells[pr][pc + 1].isBlack
        : pr === height - 1 || cells[pr + 1][pc].isBlack

    if (isWordEnd) {
      // Confirm this cell actually belongs to a word in the right direction
      const hasClue =
        dir === 'across'
          ? !(pc === 0 || cells[pr][pc - 1].isBlack) || // mid-word is fine
            (pc < width - 1 && !cells[pr][pc + 1].isBlack) // single-cell guard
          : !(pr === 0 || cells[pr - 1][pc].isBlack) ||
            (pr < height - 1 && !cells[pr + 1][pc].isBlack)

      // A simpler check: the word must be at least 2 cells long
      const wordCells = getWordIndices(pr, pc, dir, puzzle)
      if (wordCells.length < 2) continue

      // Land on the last cell of that word
      const lastCell = wordCells[wordCells.length - 1]
      return { nextIdx: lastCell, shouldClear: true }
    }
  }

  return { nextIdx: idx, shouldClear: false }
}

/**
 * Check puzzle completion — every non-black cell matches the solution.
 */
function checkComplete(cellStates: CellState[], puzzle: Puzzle): boolean {
  const { width, height, cells } = puzzle.grid
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const def = cells[r][c]
      if (def.isBlack) continue
      const state = cellStates[r * width + c]
      if (!state?.letter || state.letter !== def.solution) return false
    }
  }
  return true
}

// ─── Cell component ───────────────────────────────────────────────────────────

interface CellProps {
  letter: string
  clueNumber: number | null
  isBlack: boolean
  isCircled: boolean
  isSelected: boolean
  isActiveWord: boolean
  isCorrect: boolean | null
  size: number
  edgeStyle: { borderTopWidth: number; borderLeftWidth: number }
  onPress: () => void
}

const Cell = React.memo(
  function Cell({
    letter,
    clueNumber,
    isBlack,
    isCircled,
    isSelected,
    isActiveWord,
    isCorrect,
    size,
    edgeStyle,
    onPress,
  }: CellProps) {
    if (isBlack) {
      return (
        <View
          style={[
            styles.cell,
            styles.blackCell,
            edgeStyle,
            { width: size, height: size },
          ]}
        />
      )
    }

    const bg = isSelected
      ? COLOR.activeCellBg
      : isActiveWord
        ? COLOR.activeWordBg
        : isCorrect === true
          ? COLOR.correct
          : isCorrect === false
            ? COLOR.incorrect
            : COLOR.white

    const numSize = Math.max(7, size * 0.28)
    const letterSize = Math.max(12, size * 0.45)

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[
          styles.cell,
          edgeStyle,
          { width: size, height: size, backgroundColor: bg },
        ]}
      >
        {clueNumber !== null && (
          <Text
            style={[
              styles.clueNum,
              { fontSize: numSize, lineHeight: numSize + 1 },
            ]}
          >
            {clueNumber}
          </Text>
        )}
        <Text style={[styles.cellText, { fontSize: letterSize }]}>
          {letter}
        </Text>
        {isCircled && (
          <View
            style={[
              styles.circle,
              {
                width: size - 2,
                height: size - 2,
                borderRadius: (size - 2) / 2,
              },
            ]}
          />
        )}
      </TouchableOpacity>
    )
  },
  (prev, next) =>
    prev.letter === next.letter &&
    prev.isSelected === next.isSelected &&
    prev.isActiveWord === next.isActiveWord &&
    prev.isBlack === next.isBlack &&
    prev.isCorrect === next.isCorrect &&
    prev.size === next.size &&
    prev.clueNumber === next.clueNumber &&
    prev.isCircled === next.isCircled &&
    prev.edgeStyle.borderTopWidth === next.edgeStyle.borderTopWidth &&
    prev.edgeStyle.borderLeftWidth === next.edgeStyle.borderLeftWidth
)

// ─── Main component ───────────────────────────────────────────────────────────

export default function GridInner({ puzzleState, onNavigateClue }: Props) {
  const { updateActivePuzzle } = usePuzzle()
  const window = useWindowDimensions()

  const puzzle = puzzleState.puzzle as Puzzle
  const { width, height, cells } = puzzle.grid
  const total = width * height

  // ── Responsive sizing ──────────────────────────────────────────────────────
  const maxGridWidth = Math.max(100, window.width - HORIZONTAL_MARGIN)
  const maxGridHeight = Math.max(100, window.height * GRID_HEIGHT_FRACTION)
  const cellSize = Math.max(
    MIN_CELL_SIZE,
    Math.floor(
      Math.min(
        maxGridWidth / Math.max(1, width),
        maxGridHeight / Math.max(1, height),
        MAX_CELL_SIZE
      )
    )
  )
  const gridPixelWidth = width * cellSize + 1 // +1 for the left edge border
  const gridPixelHeight = height * cellSize + 1 // +1 for the top edge border

  // ── Pre-computed word map (stable for this puzzle) ─────────────────────────
  const wordMap = useMemo(() => buildWordMap(puzzle), [puzzle])

  // ── Local state ────────────────────────────────────────────────────────────
  const initCellStates = (answers?: string[]): CellState[] => {
    const base = Array.isArray(answers) ? answers : []
    return Array.from({ length: total }, (_, i) => ({
      letter: base[i] ?? '',
      isCorrect: null,
    }))
  }

  const [cellStates, setCellStates] = useState<CellState[]>(() =>
    initCellStates(puzzleState.userAnswers)
  )
  const [selectedIndex, setSelectedIndex] = useState<number>(
    puzzleState.currentIndex ?? 0
  )
  const [selectedDirection, setSelectedDirection] = useState<Direction>(
    (puzzleState.direction as Direction) ?? 'across'
  )
  const [isPuzzleComplete, setIsPuzzleComplete] = useState(false)

  // ── Sync in from context (only when puzzle identity changes) ───────────────
  // We use a ref to track whether a context update originated from us, so we
  // don't clobber in-progress edits.
  const isSyncingRef = useRef(false)
  const getPuzzleId = (p: Puzzle) =>
    `${p.title ?? ''}::${p.author ?? ''}::${p.grid.width}x${p.grid.height}`
  const puzzleIdRef = useRef(getPuzzleId(puzzle))

  useEffect(() => {
    const newId = getPuzzleId(puzzle)
    if (newId !== puzzleIdRef.current) {
      // Different puzzle loaded — reset everything
      puzzleIdRef.current = newId
      setCellStates(initCellStates(puzzleState.userAnswers))
      setSelectedIndex(puzzleState.currentIndex ?? 0)
      setSelectedDirection((puzzleState.direction as Direction) ?? 'across')
      setIsPuzzleComplete(false)
    }
    // Intentionally NOT re-running on every puzzleState change to prevent
    // overwriting local edits on parent re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle])

  // ── Hidden input ref ───────────────────────────────────────────────────────
  const inputRef = useRef<TextInput | null>(null)
  // Sentinel value approach: seed the input with 'a' so any keystroke is a diff
  const SENTINEL = 'a'

  // Always-current refs so callbacks never read stale closure values
  const selectedIndexRef = useRef(selectedIndex)
  const selectedDirectionRef = useRef(selectedDirection)
  const cellStatesRef = useRef(cellStates)
  useEffect(() => {
    selectedIndexRef.current = selectedIndex
  }, [selectedIndex])
  useEffect(() => {
    selectedDirectionRef.current = selectedDirection
  }, [selectedDirection])
  useEffect(() => {
    cellStatesRef.current = cellStates
  }, [cellStates])

  // Suppresses onChangeText when backspace is being handled by onKeyPress
  const isHandlingBackspaceRef = useRef(false)

  useEffect(() => {
    const t = setTimeout(() => {
      inputRef.current?.focus()
    }, 10)
    return () => clearTimeout(t)
  }, [selectedIndex])

  // ── Active word indices ────────────────────────────────────────────────────
  const activeWordIndices = useMemo(() => {
    const r = Math.floor(selectedIndex / width)
    const c = selectedIndex % width
    if (cells[r][c].isBlack) return new Set<number>()
    return new Set(getWordIndices(r, c, selectedDirection, puzzle))
  }, [selectedIndex, selectedDirection, puzzle, width, cells])

  // ── Active clue number (passed to ClueBar) ─────────────────────────────────
  // Derived from wordMap so it's always consistent with the positional clue match
  const activeClueNumber = useMemo(
    () =>
      getActiveClueNumber(selectedIndex, selectedDirection, puzzle, wordMap),
    [selectedIndex, selectedDirection, puzzle, wordMap]
  )

  // ── Debounced context sync ─────────────────────────────────────────────────
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleSave = useCallback(
    (states: CellState[], idx: number) => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current)
      saveDebounceRef.current = setTimeout(() => {
        isSyncingRef.current = true
        updateActivePuzzle({
          userAnswers: states.map((s) => s.letter),
          currentIndex: idx,
        })
        setTimeout(() => {
          isSyncingRef.current = false
        }, 50)
      }, SYNC_DEBOUNCE_MS)
    },
    [updateActivePuzzle]
  )

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current)
      updateActivePuzzle({
        userAnswers: cellStates.map((s) => s.letter),
        currentIndex: selectedIndex,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Navigation helpers ─────────────────────────────────────────────────────
  const toggleDirection = useCallback(() => {
    setSelectedDirection((d) => {
      const next: Direction = d === 'across' ? 'down' : 'across'
      updateActivePuzzle({ direction: next })
      return next
    })
  }, [updateActivePuzzle])

  /**
   * Jump to the next cell in the current word, or — if at the word end — jump
   * to the first empty cell in the next word in reading order.
   */
  const advanceSelection = useCallback(
    (currentIdx: number, dir: Direction, states: CellState[]) => {
      const next = advanceInWord(currentIdx, dir, puzzle)
      if (next !== currentIdx) {
        setSelectedIndex(next)
        return next
      }
      // At word boundary: find next word's first blank cell
      for (let probe = currentIdx + 1; probe < total; probe++) {
        const pr = Math.floor(probe / width)
        const pc = probe % width
        if (cells[pr][pc].isBlack) continue
        const clue =
          dir === 'across'
            ? wordMap.acrossClue[pr][pc]
            : wordMap.downClue[pr][pc]
        if (clue === null) continue
        // Check if this is the start of a word
        const isWordStart =
          dir === 'across'
            ? pc === 0 || cells[pr][pc - 1].isBlack
            : pr === 0 || cells[pr - 1][pc].isBlack
        if (isWordStart) {
          // Find first blank in this word
          const wordCells = getWordIndices(pr, pc, dir, puzzle)
          const firstBlank =
            wordCells.find((i) => !states[i]?.letter) ?? wordCells[0]
          setSelectedIndex(firstBlank)
          return firstBlank
        }
      }
      return currentIdx
    },
    [puzzle, total, width, cells, wordMap]
  )

  // ── Cell press ─────────────────────────────────────────────────────────────
  const handleCellPress = useCallback(
    (idx: number) => {
      const r = Math.floor(idx / width)
      const c = idx % width
      if (cells[r][c].isBlack) return

      if (idx === selectedIndex) {
        toggleDirection()
      } else {
        setSelectedIndex(idx)
        updateActivePuzzle({ currentIndex: idx })
      }
    },
    [cells, selectedIndex, toggleDirection, updateActivePuzzle, width]
  )

  // ── Navigate to clue (from ClueBar) ───────────────────────────────────────
  const handleNavigateClue = useCallback(
    (clueNumber: number, dir: Direction) => {
      if (dir !== selectedDirectionRef.current) {
        setSelectedDirection(dir)
        updateActivePuzzle({ direction: dir })
      }

      for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
          const cell = cells[r][c]
          if (cell.isBlack || cell.number !== clueNumber) continue

          // Confirm it starts a real word (≥2 cells) in the requested direction
          const startsAcross =
            (c === 0 || cells[r][c - 1].isBlack) &&
            c < width - 1 &&
            !cells[r][c + 1].isBlack
          const startsDown =
            (r === 0 || cells[r - 1][c].isBlack) &&
            r < height - 1 &&
            !cells[r + 1][c].isBlack

          if (dir === 'across' && !startsAcross) continue
          if (dir === 'down' && !startsDown) continue

          const wordCells = getWordIndices(r, c, dir, puzzle)
          const target =
            wordCells.find((i) => !cellStatesRef.current[i]?.letter) ??
            wordCells[0]

          setSelectedIndex(target)
          updateActivePuzzle({ currentIndex: target, direction: dir })
          onNavigateClue?.(clueNumber, dir)
          return
        }
      }
    },
    [cells, height, width, puzzle, updateActivePuzzle, onNavigateClue]
  )

  // ── Character input ────────────────────────────────────────────────────────
  const handleChangeText = useCallback(
    (t: string) => {
      // Backspace deletes the sentinel so onChangeText fires with ''.
      // We handle backspace entirely in onKeyPress — suppress here.
      if (isHandlingBackspaceRef.current) {
        isHandlingBackspaceRef.current = false
        inputRef.current?.setNativeProps({ text: SENTINEL })
        return
      }

      const ch = t.replace(SENTINEL, '').trim().slice(-1).toUpperCase()
      inputRef.current?.setNativeProps({ text: SENTINEL })

      if (!ch) return
      if (ch === ' ') {
        toggleDirection()
        return
      }
      if (!/[A-Z]/.test(ch)) return

      const curIdx = selectedIndexRef.current
      const curDir = selectedDirectionRef.current

      setCellStates((prev) => {
        const next = prev.slice()
        next[curIdx] = { letter: ch, isCorrect: null }
        scheduleSave(next, curIdx)
        if (checkComplete(next, puzzle)) setIsPuzzleComplete(true)
        return next
      })

      setSelectedIndex((cur) =>
        advanceSelection(cur, curDir, cellStatesRef.current)
      )
    },
    [advanceSelection, puzzle, scheduleSave, toggleDirection]
  )

  // ── Key press (backspace, arrows, enter) ───────────────────────────────────
  const handleKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      const key = e.nativeEvent.key

      if (key === 'Backspace') {
        // Flag so the subsequent onChangeText('' ) call is ignored
        isHandlingBackspaceRef.current = true

        const curIdx = selectedIndexRef.current
        const curDir = selectedDirectionRef.current

        setCellStates((prev) => {
          const { nextIdx, shouldClear } = retreatSelection(
            curIdx,
            curDir,
            prev,
            puzzle
          )
          const next = prev.slice()
          if (shouldClear) next[nextIdx] = { letter: '', isCorrect: null }
          if (nextIdx !== curIdx) setSelectedIndex(nextIdx)
          scheduleSave(next, nextIdx)
          return next
        })
        return
      }

      // Arrow navigation — free movement, skips black cells
      const r = Math.floor(selectedIndexRef.current / width)
      const c = selectedIndexRef.current % width

      const move = (nr: number, nc: number) => {
        if (nr < 0 || nr >= height || nc < 0 || nc >= width) return
        if (cells[nr][nc].isBlack) return
        setSelectedIndex(nr * width + nc)
      }

      if (key === 'ArrowLeft') move(r, c - 1)
      if (key === 'ArrowRight') move(r, c + 1)
      if (key === 'ArrowUp') move(r - 1, c)
      if (key === 'ArrowDown') move(r + 1, c)
      if (key === 'Enter') toggleDirection()
    },
    [cells, height, puzzle, scheduleSave, toggleDirection, width]
  )

  const headerHeight = useHeaderHeight()

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.kavContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={headerHeight}
    >
      {/* Grid + completion banner fills available space */}
      <View style={styles.container}>
        {isPuzzleComplete && (
          <View style={styles.completionBanner}>
            <Text style={styles.completionText}>🎉 Puzzle Complete!</Text>
          </View>
        )}

        <ScrollView
          style={{ maxHeight: maxGridHeight }}
          contentContainerStyle={styles.scrollOuter}
          scrollEnabled={false}
        >
          <ScrollView horizontal contentContainerStyle={styles.scrollInner}>
            <View
              style={[
                styles.gridContainer,
                { width: gridPixelWidth, height: gridPixelHeight },
              ]}
            >
              {Array.from({ length: height }, (_, r) => (
                <View key={`row-${r}`} style={{ flexDirection: 'row' }}>
                  {Array.from({ length: width }, (__, c) => {
                    const idx = r * width + c
                    const def = cells[r][c]
                    const state = cellStates[idx]

                    // Derive the corner label from wordMap — cell.number is
                    // a sequential index in xword-parser, not the clue number
                    const acrossNum = wordMap.acrossClue[r][c]
                    const downNum = wordMap.downClue[r][c]
                    const isWordStart =
                      (acrossNum !== null &&
                        (c === 0 || cells[r][c - 1].isBlack)) ||
                      (downNum !== null && (r === 0 || cells[r - 1][c].isBlack))
                    const clueNum = isWordStart ? (acrossNum ?? downNum) : null

                    const edgeStyle = {
                      borderTopWidth: r === 0 ? 1 : 0,
                      borderLeftWidth: c === 0 ? 1 : 0,
                    }

                    return (
                      <Cell
                        key={`cell-${r}-${c}`}
                        letter={state?.letter ?? ''}
                        clueNumber={clueNum}
                        isBlack={def.isBlack}
                        isCircled={def.isCircled ?? false}
                        isSelected={idx === selectedIndex}
                        isActiveWord={activeWordIndices.has(idx)}
                        isCorrect={state?.isCorrect ?? null}
                        size={cellSize}
                        edgeStyle={edgeStyle}
                        onPress={() => handleCellPress(idx)}
                      />
                    )
                  })}
                </View>
              ))}

              {/* Hidden sentinel-based TextInput */}
              <TextInput
                ref={inputRef}
                defaultValue={SENTINEL}
                style={styles.hiddenInput}
                autoCapitalize="characters"
                autoCorrect={false}
                spellCheck={false}
                caretHidden
                keyboardType="default"
                onChangeText={handleChangeText}
                onKeyPress={handleKeyPress}
              />
            </View>
          </ScrollView>
        </ScrollView>
      </View>

      {/* ClueBar is a direct child of KAV — it gets pushed up with the keyboard */}
      <ClueBar
        puzzle={puzzle}
        activeClueNumber={activeClueNumber}
        direction={selectedDirection}
        onNavigateClue={handleNavigateClue}
        onToggleDirection={toggleDirection}
      />
    </KeyboardAvoidingView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  kavContainer: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
  },
  scrollOuter: {
    alignItems: 'center',
  },
  scrollInner: {
    alignItems: 'center',
  },
  gridContainer: {
    backgroundColor: COLOR.white,
    borderWidth: 0,
    position: 'relative',
  },
  cell: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderColor: '#c0c0c0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  blackCell: {
    backgroundColor: COLOR.black,
    borderColor: COLOR.black,
  },
  clueNum: {
    position: 'absolute',
    top: 1,
    left: 2,
    color: COLOR.clueNum,
    fontWeight: '500',
    includeFontPadding: false,
  },
  cellText: {
    fontWeight: '700',
    color: COLOR.letterText,
    includeFontPadding: false,
    textAlign: 'center',
  },
  circle: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: COLOR.circleStroke,
    backgroundColor: 'transparent',
    top: 1,
    left: 1,
  },
  hiddenInput: {
    position: 'absolute',
    left: -9999,
    top: -9999,
    width: 1,
    height: 1,
    opacity: 0,
  },
  completionBanner: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  completionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
})
