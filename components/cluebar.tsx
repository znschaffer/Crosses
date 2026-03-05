import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native'
import type { Puzzle } from '@xwordly/xword-parser'

// ─── Types ────────────────────────────────────────────────────────────────────

type Direction = 'across' | 'down'

export interface ClueBarProps {
  puzzle: Puzzle
  /** Pre-computed from GridInner's wordMap — avoids re-deriving clue numbers */
  activeClueNumber: number | null
  direction: Direction
  onNavigateClue: (clueNumber: number, direction: Direction) => void
  onToggleDirection: () => void
}

interface ClueEntry {
  number: number
  text: string
  direction: Direction
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract a flat sorted list of clues for one direction from the puzzle.
 * xword-parser returns Clue[] = { number, text }[] already in reading order.
 */
function extractClues(puzzle: Puzzle, dir: Direction): ClueEntry[] {
  const raw = dir === 'across' ? puzzle.clues?.across : puzzle.clues?.down
  if (!Array.isArray(raw)) return []
  return raw
    .filter((c) => c?.number != null && c?.text != null)
    .map((c) => ({
      number: Number(c.number),
      text: String(c.text),
      direction: dir,
    }))
}

// ─── Clue Modal ───────────────────────────────────────────────────────────────

interface ClueModalProps {
  visible: boolean
  clues: ClueEntry[]
  activeNumber: number | null
  direction: Direction
  onSelectClue: (entry: ClueEntry) => void
  onClose: () => void
}

function ClueModal({
  visible,
  clues,
  activeNumber,
  direction,
  onSelectClue,
  onClose,
}: ClueModalProps) {
  const scrollRef = useRef<ScrollView>(null)

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={() => {}}>
          {/* Handle bar */}
          <View style={styles.modalHandle} />

          <Text style={styles.modalTitle}>
            {direction === 'across' ? 'Across' : 'Down'}
          </Text>

          <ScrollView
            ref={scrollRef}
            style={styles.modalScroll}
            showsVerticalScrollIndicator={false}
          >
            {clues.map((entry) => {
              const isActive = entry.number === activeNumber
              return (
                <TouchableOpacity
                  key={entry.number}
                  style={[styles.modalRow, isActive && styles.modalRowActive]}
                  onPress={() => {
                    onSelectClue(entry)
                    onClose()
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.modalNum, isActive && styles.modalNumActive]}
                  >
                    {entry.number}
                  </Text>
                  <Text
                    style={[
                      styles.modalClueText,
                      isActive && styles.modalClueTextActive,
                    ]}
                  >
                    {entry.text}
                  </Text>
                </TouchableOpacity>
              )
            })}
            {/* bottom breathing room above keyboard */}
            <View style={{ height: 32 }} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

// ─── Main ClueBar ─────────────────────────────────────────────────────────────

export default function ClueBar({
  puzzle,
  activeClueNumber,
  direction,
  onNavigateClue,
  onToggleDirection,
}: ClueBarProps) {
  const [modalVisible, setModalVisible] = useState(false)

  // Build clue lists once per puzzle
  const acrossClues = useMemo(() => extractClues(puzzle, 'across'), [puzzle])
  const downClues = useMemo(() => extractClues(puzzle, 'down'), [puzzle])
  const activeClues = direction === 'across' ? acrossClues : downClues

  // activeClueNumber comes pre-computed from GridInner's wordMap
  const activeEntry = useMemo(
    () => activeClues.find((c) => c.number === activeClueNumber) ?? null,
    [activeClues, activeClueNumber]
  )

  const activeIndex = useMemo(
    () => activeClues.findIndex((c) => c.number === activeClueNumber),
    [activeClues, activeClueNumber]
  )

  // Prev / next clue navigation
  const handlePrev = useCallback(() => {
    if (activeIndex <= 0) return
    const prev = activeClues[activeIndex - 1]
    onNavigateClue(prev.number, direction)
  }, [activeClues, activeIndex, direction, onNavigateClue])

  const handleNext = useCallback(() => {
    if (activeIndex < 0 || activeIndex >= activeClues.length - 1) return
    const next = activeClues[activeIndex + 1]
    onNavigateClue(next.number, direction)
  }, [activeClues, activeIndex, direction, onNavigateClue])

  const hasPrev = activeIndex > 0
  const hasNext = activeIndex >= 0 && activeIndex < activeClues.length - 1

  return (
    <>
      <View style={styles.bar}>
        {/* ── Left: prev arrow ── */}
        <TouchableOpacity
          onPress={handlePrev}
          disabled={!hasPrev}
          style={styles.arrowBtn}
          hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
        >
          <Text style={[styles.arrowText, !hasPrev && styles.arrowDisabled]}>
            ‹
          </Text>
        </TouchableOpacity>

        {/* ── Centre: clue number badge + text ── */}
        <TouchableOpacity
          style={styles.clueArea}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.75}
        >
          {activeEntry ? (
            <View style={styles.clueInner}>
              <View style={styles.clueBadge}>
                <Text style={styles.clueBadgeText}>
                  {activeEntry.number}
                  {direction === 'across' ? 'A' : 'D'}
                </Text>
              </View>
              <Text
                style={styles.clueText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {activeEntry.text}
              </Text>
            </View>
          ) : (
            <Text style={styles.clueTextEmpty}>—</Text>
          )}
        </TouchableOpacity>

        {/* ── Right: direction toggle + next arrow ── */}
        <TouchableOpacity
          onPress={onToggleDirection}
          style={styles.dirBtn}
          hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
        >
          <Text style={styles.dirBtnText}>
            {direction === 'across' ? '↔' : '↕'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNext}
          disabled={!hasNext}
          style={styles.arrowBtn}
          hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
        >
          <Text style={[styles.arrowText, !hasNext && styles.arrowDisabled]}>
            ›
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Full clue list modal ── */}
      <ClueModal
        visible={modalVisible}
        clues={activeClues}
        activeNumber={activeClueNumber}
        direction={direction}
        onSelectClue={(entry) => onNavigateClue(entry.number, entry.direction)}
        onClose={() => setModalVisible(false)}
      />
    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BAR_HEIGHT = 44

const styles = StyleSheet.create({
  // ── Clue bar ────────────────────────────────────────────────────────────────
  bar: {
    height: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f7',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#c8c8cc',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#c8c8cc',
    paddingHorizontal: 4,
  },
  arrowBtn: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 28,
    lineHeight: 32,
    color: '#1976D2',
    fontWeight: '300',
  },
  arrowDisabled: {
    color: '#c0c0c8',
  },
  clueArea: {
    flex: 1,
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  clueInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clueBadge: {
    backgroundColor: '#1976D2',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    flexShrink: 0,
  },
  clueBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  clueText: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  clueTextEmpty: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
  dirBtn: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dirBtnText: {
    fontSize: 18,
    color: '#1976D2',
  },

  // ── Modal ───────────────────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%',
    paddingTop: 8,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    // Android elevation
    elevation: 12,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d0d0d8',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalScroll: {
    paddingHorizontal: 16,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ebebef',
    gap: 10,
  },
  modalRowActive: {
    backgroundColor: '#EFF6FF',
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  modalNum: {
    width: 28,
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    paddingTop: 1,
    flexShrink: 0,
  },
  modalNumActive: {
    color: '#1976D2',
  },
  modalClueText: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  modalClueTextActive: {
    fontWeight: '600',
    color: '#1976D2',
  },
})
