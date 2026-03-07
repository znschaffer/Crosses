import { COLOR } from '@/constants/theme'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native'
import type { CrosswordJSON } from 'xd-crossword-tools'

// ─── Types ────────────────────────────────────────────────────────────────────

type Direction = 'across' | 'down'

export interface ClueBarProps {
  puzzle: CrosswordJSON
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
 * xd-crossword-tools clues shape:
 *   puzzle.clues.across[n] = { number, body, answer, position, tiles, ... }
 *   puzzle.clues.down[n]   = same
 * `body` is the clue text.
 */
function extractClues(puzzle: CrosswordJSON, dir: Direction): ClueEntry[] {
  const raw = dir === 'across' ? puzzle.clues?.across : puzzle.clues?.down
  if (!Array.isArray(raw)) return []
  return raw
    .filter((c) => c?.number != null && c?.body != null)
    .map((c) => ({
      number: Number(c.number),
      text: String(c.body),
      direction: dir,
    }))
}

// ─── Clue Modal ───────────────────────────────────────────────────────────────

interface ClueModalProps {
  visible: boolean
  clues: ClueEntry[]
  activeNumber: number | null
  direction: Direction
  onToggleDirection: () => void
  onSelectClue: (entry: ClueEntry) => void
  onClose: () => void
}

function ClueModal({
  visible,
  clues,
  activeNumber,
  direction,
  onToggleDirection,
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
          <View style={styles.modalHandle} />
          <Pressable onPress={onToggleDirection}>
            <Text style={styles.modalTitle}>
              {direction === 'across' ? 'Across' : 'Down'}
            </Text>
          </Pressable>
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

  const acrossClues = useMemo(() => extractClues(puzzle, 'across'), [puzzle])
  const downClues = useMemo(() => extractClues(puzzle, 'down'), [puzzle])
  const activeClues = direction === 'across' ? acrossClues : downClues

  const activeEntry = useMemo(
    () => activeClues.find((c) => c.number === activeClueNumber) ?? null,
    [activeClues, activeClueNumber]
  )
  const activeIndex = useMemo(
    () => activeClues.findIndex((c) => c.number === activeClueNumber),
    [activeClues, activeClueNumber]
  )

  const hasPrev = activeIndex > 0
  const hasNext = activeIndex >= 0 && activeIndex < activeClues.length - 1

  const handlePrev = useCallback(() => {
    if (!hasPrev) return
    const prev = activeClues[activeIndex - 1]
    onNavigateClue(prev.number, direction)
  }, [activeClues, activeIndex, direction, hasPrev, onNavigateClue])

  const handleNext = useCallback(() => {
    if (!hasNext) return
    const next = activeClues[activeIndex + 1]
    onNavigateClue(next.number, direction)
  }, [activeClues, activeIndex, direction, hasNext, onNavigateClue])

  return (
    <>
      <View style={styles.bar}>
        {/* Prev */}
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

        {/* Clue text */}
        <TouchableOpacity
          style={styles.clueArea}
          // onPress={() => setModalVisible(true)}
          onPress={() => onToggleDirection()}
          activeOpacity={0.75}
        >
          {activeEntry ? (
            <View style={styles.clueInner}>
              {/*<View style={styles.clueBadge}>
                <Text style={styles.clueBadgeText}>
                  {activeEntry.number}
                  {direction === 'across' ? 'A' : 'D'}
                </Text>
              </View>*/}
              <Text
                style={styles.clueText}
                numberOfLines={2}
                ellipsizeMode="tail"
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {activeEntry.text}
              </Text>
            </View>
          ) : (
            <Text style={styles.clueTextEmpty}>—</Text>
          )}
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

      <ClueModal
        visible={modalVisible}
        clues={activeClues}
        activeNumber={activeClueNumber}
        direction={direction}
        onToggleDirection={() => onToggleDirection()}
        onSelectClue={(entry) => onNavigateClue(entry.number, entry.direction)}
        onClose={() => setModalVisible(false)}
      />
    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BAR_HEIGHT = 44

const styles = StyleSheet.create({
  bar: {
    height: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLOR.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#c8c8cc',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#c8c8cc',
    paddingHorizontal: 4,
  },
  arrowBtn: { width: 36, alignItems: 'center', justifyContent: 'center' },
  arrowText: {
    fontSize: 28,
    lineHeight: 32,
    color: '#1976D2',
    fontWeight: '300',
  },
  arrowDisabled: { color: '#c0c0c8' },
  clueArea: { flex: 1, paddingHorizontal: 6, justifyContent: 'center' },
  clueInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  clueText: { flex: 1, fontSize: 14, color: '#1a1a1a', fontWeight: '500' },
  clueTextEmpty: { fontSize: 14, color: '#aaa', textAlign: 'center' },
  dirBtn: { width: 36, alignItems: 'center', justifyContent: 'center' },
  dirBtnText: { fontSize: 18, color: '#1976D2' },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
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
  modalScroll: { paddingHorizontal: 16 },
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
  modalNumActive: { color: '#1976D2' },
  modalClueText: { flex: 1, fontSize: 15, color: '#1a1a1a', lineHeight: 20 },
  modalClueTextActive: { fontWeight: '600', color: '#1976D2' },
})
