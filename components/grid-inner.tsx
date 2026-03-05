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
import type { CrosswordJSON } from 'xd-crossword-tools'
import { usePuzzle } from '@/contexts/PuzzleContext'
import { PuzzleState } from '@/types/PuzzleState.t'
import ClueBar from './cluebar'
import { useHeaderHeight } from '@react-navigation/elements'

// ─── Layout constants ─────────────────────────────────────────────────────────
const MIN_CELL_SIZE = 20
const MAX_CELL_SIZE = 64
const GRID_HEIGHT_FRACTION = 0.55
const HORIZONTAL_MARGIN = 32
const SYNC_DEBOUNCE_MS = 700

// ─── Colours ──────────────────────────────────────────────────────────────────
const COLOR = {
  black: '#1a1a1a',
  white: '#ffffff',
  border: '#c0c0c0',
  activeCellBg: '#f7da21',
  activeWordBg: '#a7d8f0',
  circleStroke: '#888888',
  correct: '#d4edda',
  incorrect: '#f8d7da',
  clueNum: '#333333',
  letterText: '#1a1a1a',
} as const

// ─── Types ────────────────────────────────────────────────────────────────────
type Direction = 'across' | 'down'

interface WordMap {
  acrossClue: (number | null)[][]
  downClue: (number | null)[][]
}

interface CellState {
  letter: string
  isCorrect: boolean | null
}

type Props = {
  puzzleState: PuzzleState
  onNavigateClue?: (clueNumber: number, direction: Direction) => void
}

// ─── Grid helpers ─────────────────────────────────────────────────────────────

function isBlank(puzzle: CrosswordJSON, r: number, c: number): boolean {
  return puzzle.tiles[r]?.[c]?.type === 'blank'
}

function getTileLetter(puzzle: CrosswordJSON, r: number, c: number): string {
  const t = puzzle.tiles[r]?.[c]
  return t?.type === 'letter' ? t.letter : ''
}

function getGridDimensions(puzzle: CrosswordJSON) {
  const height = puzzle.tiles.length
  const width = puzzle.tiles[0]?.length ?? 0
  return { width, height }
}

// ─── Pre-compute helpers ──────────────────────────────────────────────────────

/**
 * Build lookup maps: acrossClue[r][c] and downClue[r][c] → clue number | null.
 *
 * xd-crossword-tools gives us each clue's exact start position and tile count,
 * so we stamp the clue number on every cell in the word directly — no geometry
 * guessing, no grid walking required.
 */
function buildWordMap(puzzle: CrosswordJSON): WordMap {
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

function getActiveClueNumber(
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

/**
 * Return all flat indices forming the word that contains (r, c) in direction dir.
 * Derived from black-cell geometry — consistent with how xd-crossword-tools lays
 * out tiles.
 */
function getWordIndices(
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

function advanceInWord(
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

function retreatInWord(
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

function retreatSelection(
  idx: number,
  dir: Direction,
  cellStates: CellState[],
  puzzle: CrosswordJSON
): { nextIdx: number; shouldClear: boolean } {
  const { width, height } = getGridDimensions(puzzle)

  // Case 1: current cell has a letter — erase in place
  if (cellStates[idx]?.letter) {
    return { nextIdx: idx, shouldClear: true }
  }

  // Case 2: step back within the word
  const within = retreatInWord(idx, dir, puzzle)
  if (within !== idx) {
    return { nextIdx: within, shouldClear: true }
  }

  // Case 3: at word start — jump to last cell of previous word
  for (let probe = idx - 1; probe >= 0; probe--) {
    const pr = Math.floor(probe / width)
    const pc = probe % width
    if (isBlank(puzzle, pr, pc)) continue

    const isWordEnd =
      dir === 'across'
        ? pc === width - 1 || isBlank(puzzle, pr, pc + 1)
        : pr === height - 1 || isBlank(puzzle, pr + 1, pc)

    if (isWordEnd) {
      const wordCells = getWordIndices(pr, pc, dir, puzzle)
      if (wordCells.length < 2) continue
      return { nextIdx: wordCells[wordCells.length - 1], shouldClear: true }
    }
  }

  return { nextIdx: idx, shouldClear: false }
}

function checkComplete(
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

  const puzzle = puzzleState.puzzle
  const { width, height } = getGridDimensions(puzzle)
  const total = width * height

  // ── Sizing ────────────────────────────────────────────────────────────────
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
  const gridPixelWidth = width * cellSize + 1
  const gridPixelHeight = height * cellSize + 1

  // ── Word map ──────────────────────────────────────────────────────────────
  const wordMap = useMemo(() => buildWordMap(puzzle), [puzzle])

  // ── Local state ───────────────────────────────────────────────────────────
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

  // ── Puzzle identity reset ─────────────────────────────────────────────────
  const getPuzzleId = (p: CrosswordJSON) =>
    `${p.meta?.title ?? ''}::${p.meta?.author ?? ''}::${p.tiles.length}x${p.tiles[0]?.length ?? 0}`
  const puzzleIdRef = useRef(getPuzzleId(puzzle))

  useEffect(() => {
    const newId = getPuzzleId(puzzle)
    if (newId !== puzzleIdRef.current) {
      puzzleIdRef.current = newId
      setCellStates(initCellStates(puzzleState.userAnswers))
      setSelectedIndex(puzzleState.currentIndex ?? 0)
      setSelectedDirection((puzzleState.direction as Direction) ?? 'across')
      setIsPuzzleComplete(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle])

  // ── Refs ──────────────────────────────────────────────────────────────────
  const inputRef = useRef<TextInput | null>(null)
  const SENTINEL = 'a'
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
  const isHandlingBackspaceRef = useRef(false)
  const isSyncingRef = useRef(false)

  // Auto-focus on cell change
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 10)
    return () => clearTimeout(t)
  }, [selectedIndex])

  // ── Active word + clue ────────────────────────────────────────────────────
  const activeWordIndices = useMemo(() => {
    const r = Math.floor(selectedIndex / width)
    const c = selectedIndex % width
    if (isBlank(puzzle, r, c)) return new Set<number>()
    return new Set(getWordIndices(r, c, selectedDirection, puzzle))
  }, [selectedIndex, selectedDirection, puzzle, width])

  const activeClueNumber = useMemo(
    () =>
      getActiveClueNumber(selectedIndex, selectedDirection, puzzle, wordMap),
    [selectedIndex, selectedDirection, puzzle, wordMap]
  )

  // ── Debounced save ────────────────────────────────────────────────────────
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

  // ── Navigation ────────────────────────────────────────────────────────────
  const toggleDirection = useCallback(() => {
    setSelectedDirection((d) => {
      const next: Direction = d === 'across' ? 'down' : 'across'
      updateActivePuzzle({ direction: next })
      return next
    })
  }, [updateActivePuzzle])

  const advanceSelection = useCallback(
    (currentIdx: number, dir: Direction, states: CellState[]) => {
      const next = advanceInWord(currentIdx, dir, puzzle)
      if (next !== currentIdx) {
        setSelectedIndex(next)
        return next
      }
      // Jump to first blank in next word
      for (let probe = currentIdx + 1; probe < total; probe++) {
        const pr = Math.floor(probe / width)
        const pc = probe % width
        if (isBlank(puzzle, pr, pc)) continue
        const clue =
          dir === 'across'
            ? wordMap.acrossClue[pr][pc]
            : wordMap.downClue[pr][pc]
        if (clue === null) continue
        const isWordStart =
          dir === 'across'
            ? pc === 0 || isBlank(puzzle, pr, pc - 1)
            : pr === 0 || isBlank(puzzle, pr - 1, pc)
        if (isWordStart) {
          const wordCells = getWordIndices(pr, pc, dir, puzzle)
          const firstBlank =
            wordCells.find((i) => !states[i]?.letter) ?? wordCells[0]
          setSelectedIndex(firstBlank)
          return firstBlank
        }
      }
      return currentIdx
    },
    [puzzle, total, width, wordMap]
  )

  const handleCellPress = useCallback(
    (idx: number) => {
      const r = Math.floor(idx / width)
      const c = idx % width
      if (isBlank(puzzle, r, c)) return
      if (idx === selectedIndex) {
        toggleDirection()
      } else {
        setSelectedIndex(idx)
        updateActivePuzzle({ currentIndex: idx })
      }
    },
    [puzzle, selectedIndex, toggleDirection, updateActivePuzzle, width]
  )

  const handleNavigateClue = useCallback(
    (clueNumber: number, dir: Direction) => {
      if (dir !== selectedDirectionRef.current) {
        setSelectedDirection(dir)
        updateActivePuzzle({ direction: dir })
      }

      // Find the word start via wordMap — guaranteed correct
      const clueList =
        dir === 'across' ? puzzle.clues?.across : puzzle.clues?.down
      const clue = clueList?.find((c) => c.number === clueNumber)
      if (!clue) return

      const r = clue.position.index
      const c = clue.position.col
      const wordCells = getWordIndices(r, c, dir, puzzle)
      const target =
        wordCells.find((i) => !cellStatesRef.current[i]?.letter) ?? wordCells[0]

      setSelectedIndex(target)
      updateActivePuzzle({ currentIndex: target, direction: dir })
      onNavigateClue?.(clueNumber, dir)
    },
    [puzzle, updateActivePuzzle, onNavigateClue]
  )

  // ── Input handlers ────────────────────────────────────────────────────────
  const handleChangeText = useCallback(
    (t: string) => {
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

  const handleKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      const key = e.nativeEvent.key

      if (key === 'Backspace') {
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

      const r = Math.floor(selectedIndexRef.current / width)
      const c = selectedIndexRef.current % width

      const move = (nr: number, nc: number) => {
        if (nr < 0 || nr >= height || nc < 0 || nc >= width) return
        if (isBlank(puzzle, nr, nc)) return
        setSelectedIndex(nr * width + nc)
      }

      if (key === 'ArrowLeft') move(r, c - 1)
      if (key === 'ArrowRight') move(r, c + 1)
      if (key === 'ArrowUp') move(r - 1, c)
      if (key === 'ArrowDown') move(r + 1, c)
      if (key === 'Enter') toggleDirection()
    },
    [height, puzzle, scheduleSave, toggleDirection, width]
  )

  const headerHeight = useHeaderHeight()

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.kavContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={headerHeight}
    >
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
                    const blank = isBlank(puzzle, r, c)
                    const state = cellStates[idx]

                    // Corner label: show clue number only on word-start cells
                    const acrossNum = wordMap.acrossClue[r][c]
                    const downNum = wordMap.downClue[r][c]
                    const isAcrossStart =
                      acrossNum !== null &&
                      (c === 0 || isBlank(puzzle, r, c - 1))
                    const isDownStart =
                      downNum !== null && (r === 0 || isBlank(puzzle, r - 1, c))
                    const clueNum =
                      isAcrossStart || isDownStart
                        ? (acrossNum ?? downNum)
                        : null

                    // xd-crossword-tools has no isCircled — extend here if needed
                    const isCircled = false

                    const edgeStyle = {
                      borderTopWidth: r === 0 ? 1 : 0,
                      borderLeftWidth: c === 0 ? 1 : 0,
                    }

                    return (
                      <Cell
                        key={`cell-${r}-${c}`}
                        letter={state?.letter ?? ''}
                        clueNumber={clueNum}
                        isBlack={blank}
                        isCircled={isCircled}
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

              {/* Hidden sentinel TextInput */}
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
  kavContainer: { flex: 1, width: '100%' },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
  },
  scrollOuter: { alignItems: 'center' },
  scrollInner: { alignItems: 'center' },
  gridContainer: { backgroundColor: COLOR.white, position: 'relative' },
  cell: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderColor: COLOR.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  blackCell: { backgroundColor: COLOR.black, borderColor: COLOR.black },
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
  completionText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
