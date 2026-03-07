import { COLOR } from '@/constants/theme'
import { getPuzzleId, usePuzzle } from '@/contexts/PuzzleContext'
import { GridState, useGridState } from '@/hooks/useGridState'
import { Direction, Props } from '@/types/Grid.t'
import {
  getActiveClueNumber,
  getGridDimensions,
  getWordIndices,
  isBlank,
} from '@/utils/gridUtils'
import { useHeaderHeight } from '@react-navigation/elements'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  KeyboardAvoidingView,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native'
import { Cell } from './Cell'
import ClueBar from './cluebar'

const MIN_CELL_SIZE = 20
const MAX_CELL_SIZE = 84
const SYNC_DEBOUNCE_MS = 700

function buildInitialState(
  puzzleState: Props['puzzleState'],
  total: number
): GridState {
  const answers = Array.isArray(puzzleState.userAnswers)
    ? puzzleState.userAnswers
    : []
  return {
    cellStates: Array.from({ length: total }, (_, i) => ({
      letter: answers[i] ?? '',
      isCorrect: null,
    })),
    selectedIndex: puzzleState.currentIndex ?? 0,
    selectedDirection: (puzzleState.direction as Direction) ?? 'across',
    isPuzzleComplete: false,
  }
}

export default function GridInner({ puzzleState, onNavigateClue }: Props) {
  const puzzle = puzzleState.puzzle
  const { updateActivePuzzle } = usePuzzle()
  const { width, height } = getGridDimensions(puzzle)
  const total = width * height

  const { gridState, dispatch, wordMap } = useGridState(
    puzzle,
    buildInitialState(puzzleState, total)
  )

  const gridStateRef = useRef(gridState)
  useEffect(() => {
    gridStateRef.current = gridState
  }, [gridState])

  const puzzleIdRef = useRef(getPuzzleId(puzzle))

  useEffect(() => {
    const newId = getPuzzleId(puzzle)
    if (newId !== puzzleIdRef.current) {
      puzzleIdRef.current = newId
      const answers = Array.isArray(puzzleState.userAnswers)
        ? puzzleState.userAnswers
        : []
      dispatch({
        type: 'RESET',
        cellStates: Array.from({ length: total }, (_, i) => ({
          letter: answers[i] ?? '',
          isCorrect: null,
        })),
        selectedIndex: puzzleState.currentIndex ?? 0,
        selectedDirection: (puzzleState.direction as Direction) ?? 'across',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle])

  const inputRef = useRef<TextInput | null>(null)
  const SENTINEL = 'a'
  const isHandlingBackspaceRef = useRef(false)

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 10)
    return () => clearTimeout(t)
  }, [gridState.selectedIndex, gridState.selectedDirection])

  const [gridAreaSize, setGridAreaSize] = useState<{
    w: number
    h: number
  } | null>(null)
  const onGridAreaLayout = useCallback((e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout
    setGridAreaSize({ w, h })
  }, [])

  const cellSize = useMemo(() => {
    if (!gridAreaSize) return MIN_CELL_SIZE

    const cellFromWidth = gridAreaSize.w / Math.max(1, width)
    const cellFromHeight = gridAreaSize.h / Math.max(1, height)
    const exact = Math.min(cellFromWidth, cellFromHeight)

    return Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, exact))
  }, [gridAreaSize, width, height])

  const gridPixelWidth = gridAreaSize?.w ?? width * cellSize
  const gridPixelHeight = height * cellSize

  const activeWordIndices = useMemo(() => {
    const r = Math.floor(gridState.selectedIndex / width)
    const c = gridState.selectedIndex % width
    if (isBlank(puzzle, r, c)) return new Set<number>()
    return new Set(getWordIndices(r, c, gridState.selectedDirection, puzzle))
  }, [gridState.selectedIndex, gridState.selectedDirection, puzzle, width])

  const activeClueNumber = useMemo(
    () =>
      getActiveClueNumber(
        gridState.selectedIndex,
        gridState.selectedDirection,
        puzzle,
        wordMap
      ),
    [gridState.selectedIndex, gridState.selectedDirection, puzzle, wordMap]
  )

  const isInitialMount = useRef(true)

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    const timer = setTimeout(() => {
      updateActivePuzzle({
        userAnswers: gridState.cellStates.map((s) => s.letter),
        currentIndex: gridState.selectedIndex,
        direction: gridState.selectedDirection,
      })
    }, SYNC_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [gridState, updateActivePuzzle])

  useEffect(() => {
    return () => {
      updateActivePuzzle({
        userAnswers: gridStateRef.current.cellStates.map((s) => s.letter),
        currentIndex: gridStateRef.current.selectedIndex,
        direction: gridStateRef.current.selectedDirection,
      })
    }
  }, [updateActivePuzzle])

  const handleCellPress = useCallback(
    (idx: number) => {
      dispatch({ type: 'SELECT_CELL', index: idx })
      inputRef.current?.focus()
    },
    [dispatch]
  )

  const handleNavigateClue = useCallback(
    (clueNumber: number, dir: Direction) => {
      const clueList =
        dir === 'across' ? puzzle.clues?.across : puzzle.clues?.down
      const clue = clueList?.find((c) => c.number === clueNumber)
      if (!clue) return

      const r = clue.position.index
      const c = clue.position.col
      const wordCells = getWordIndices(r, c, dir, puzzle)
      const target =
        wordCells.find((i) => !gridStateRef.current.cellStates[i]?.letter) ??
        wordCells[0]

      dispatch({ type: 'NAVIGATE_TO_CLUE', index: target, direction: dir })
      inputRef.current?.focus()
      onNavigateClue?.(clueNumber, dir)
    },
    [puzzle, dispatch, onNavigateClue]
  )

  const handleChangeText = useCallback(
    (t: string) => {
      if (isHandlingBackspaceRef.current) {
        isHandlingBackspaceRef.current = false
        inputRef.current?.setNativeProps({ text: SENTINEL })
        return
      }

      const raw = t.replace(SENTINEL, '')
      const ch = raw.slice(-1).toUpperCase()
      inputRef.current?.setNativeProps({ text: SENTINEL })
      console.log(ch)

      if (!ch) return
      if (ch === ' ') {
        dispatch({ type: 'TOGGLE_DIRECTION' })
        return
      }
      if (!/[A-Z]/.test(ch)) return

      dispatch({ type: 'ENTER_LETTER', letter: ch })
    },
    [dispatch]
  )

  const handleKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      const key = e.nativeEvent.key

      if (key === 'Backspace') {
        isHandlingBackspaceRef.current = true
        dispatch({ type: 'BACKSPACE' })
        return
      }

      isHandlingBackspaceRef.current = false

      const r = Math.floor(gridState.selectedIndex / width)
      const c = gridState.selectedIndex % width

      if (key === 'ArrowLeft')
        dispatch({ type: 'ARROW_MOVE', row: r, col: c - 1 })
      if (key === 'ArrowRight')
        dispatch({ type: 'ARROW_MOVE', row: r, col: c + 1 })
      if (key === 'ArrowUp')
        dispatch({ type: 'ARROW_MOVE', row: r - 1, col: c })
      if (key === 'ArrowDown')
        dispatch({ type: 'ARROW_MOVE', row: r + 1, col: c })
      if (key === 'Enter') dispatch({ type: 'TOGGLE_DIRECTION' })
    },
    [dispatch, gridState.selectedIndex, width]
  )

  const headerHeight = useHeaderHeight()

  return (
    <KeyboardAvoidingView
      style={styles.kavContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={headerHeight}
    >
      {/* Grid area: fills all space between header and clue bar */}
      <View style={styles.gridArea} onLayout={onGridAreaLayout}>
        {gridState.isPuzzleComplete && (
          <View style={styles.completionBanner}>
            <Text style={styles.completionText}>🎉 Puzzle Complete!</Text>
          </View>
        )}

        {/* Horizontal scroll for wide puzzles; vertical scroll disabled */}
        <ScrollView
          horizontal
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
          scrollEnabled={
            gridAreaSize != null && gridPixelWidth > gridAreaSize.w
          }
        >
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
                  const state = gridState.cellStates[idx]

                  const acrossNum = wordMap.acrossClue[r][c]
                  const downNum = wordMap.downClue[r][c]
                  const isAcrossStart =
                    acrossNum !== null && (c === 0 || isBlank(puzzle, r, c - 1))
                  const isDownStart =
                    downNum !== null && (r === 0 || isBlank(puzzle, r - 1, c))
                  const clueNum = isAcrossStart
                    ? acrossNum
                    : isDownStart
                      ? downNum
                      : null

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
                      isCircled={false}
                      isSelected={idx === gridState.selectedIndex}
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
      </View>

      <ClueBar
        puzzle={puzzle}
        activeClueNumber={activeClueNumber}
        direction={gridState.selectedDirection}
        onNavigateClue={handleNavigateClue}
        onToggleDirection={() => {
          dispatch({ type: 'TOGGLE_DIRECTION' })
          inputRef.current?.focus()
        }}
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  kavContainer: { flex: 1, width: '100%' },
  gridArea: { flex: 1, width: '100%', backgroundColor: COLOR.white },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  gridContainer: {
    backgroundColor: COLOR.white,
    position: 'relative',
    alignItems: 'center',
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
