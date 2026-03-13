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
  Modal,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  TouchableOpacity,
  View,
} from 'react-native'
import { Cell } from './Cell'
import ClueBar from './cluebar'
import { router } from 'expo-router'
import { COLOR } from '@/constants/theme'

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

  const toggleDevComplete = useCallback(() => {
    const complete = !gridState.isPuzzleComplete

    dispatch({ type: 'SET_PUZZLE_COMPLETE', complete })
    updateActivePuzzle({
      complete,
      finishedAt: complete ? new Date().toISOString() : null,
    })
  }, [dispatch, gridState, updateActivePuzzle])

  return (
    <KeyboardAvoidingView
      style={styles.kavContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={headerHeight}
    >
      {/* Grid area: fills all space between header and clue bar */}
      <View style={styles.gridArea} onLayout={onGridAreaLayout}>
        {gridState.isPuzzleComplete && (
          // Change to Puzzle Complete modal centered in screen
          <Modal
            backdropColor={'#cccccc00'}
            statusBarTranslucent={true}
            navigationBarTranslucent={true}
            animationType="fade"
            visible={true}
          >
            <View style={styles.completionModal}>
              <Text>Puzzle Complete!</Text>
              <Text>
                Time:
                {puzzleState.finishedAt &&
                  (new Date(puzzleState.finishedAt).getTime() -
                    new Date(puzzleState.startedAt).getTime()) /
                    1000}
                seconds
              </Text>
              <View style={{ flexDirection: 'row', gap: 12, padding: 12 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#4CAF50',
                    borderRadius: 8,
                    justifyContent: 'center',
                    height: 36,
                    width: 64,
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    const emptyCellStates = Array.from(
                      { length: total },
                      (_, i) => {
                        const r = Math.floor(i / width)
                        const c = i % width
                        if (isBlank(puzzle, r, c))
                          return { letter: '', isCorrect: null }
                        return { letter: '', isCorrect: null }
                      }
                    )
                    dispatch({
                      type: 'RESET',
                      cellStates: emptyCellStates,
                      selectedIndex: 0,
                      selectedDirection: 'across',
                    })
                    updateActivePuzzle({
                      userAnswers: new Array(total).fill(''),
                      currentIndex: 0,
                      direction: 'across',
                      complete: false,
                      finishedAt: null,
                      startedAt: new Date().toISOString(),
                    })
                  }}
                >
                  <Text style={{ color: 'white' }}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#4CAF50',
                    borderRadius: 8,
                    justifyContent: 'center',
                    height: 36,
                    width: 64,
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    router.navigate('/(tabs)')
                  }}
                >
                  <Text style={{ color: 'white' }}>Home</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {__DEV__ && (
          <TouchableOpacity
            onPress={toggleDevComplete}
            style={[
              styles.devToggle,
              gridState.isPuzzleComplete ? styles.devToggleActive : null,
            ]}
          >
            <Text style={styles.devToggleText}>
              {gridState.isPuzzleComplete ? 'DEV: Reset' : 'DEV: Complete'}
            </Text>
          </TouchableOpacity>
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
  devToggle: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    zIndex: 9999,
  },
  devToggleActive: {
    backgroundColor: '#aa3333',
  },
  devToggleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  completionModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    maxHeight: '50%',
    borderRadius: 16,
    width: '80%',
    margin: 'auto',
  },
})
