import { PuzzleState } from '@/types/PuzzleState.t'
import { router } from 'expo-router'
import React from 'react'
import {
  StyleSheet,
  Modal,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native'
import { Colors, COLOR } from '@/constants/theme'

export default function CompletionModal({
  puzzleState,
  onReset,
}: {
  puzzleState: PuzzleState
  onReset: () => void
}) {
  const formatDurationAdaptive = (
    start?: string | null,
    end?: string | null
  ) => {
    if (!start || !end) return '—'
    let secs = Math.max(
      0,
      Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000)
    )

    if (secs < 60) {
      return `${secs}s`
    }

    if (secs < 3600) {
      const m = Math.floor(secs / 60)
      const s = secs % 60
      return s === 0 ? `${m}m` : `${m}m ${s}s`
    }

    if (secs < 86400) {
      const h = Math.floor(secs / 3600)
      const m = Math.floor((secs % 3600) / 60)
      return m === 0 ? `${h}h` : `${h}h ${m}m`
    }

    const d = Math.floor(secs / 86400)
    const h = Math.floor((secs % 86400) / 3600)
    return h === 0 ? `${d}d` : `${d}d ${h}h`
  }

  const elapsed = formatDurationAdaptive(
    puzzleState.startedAt,
    puzzleState.finishedAt
  )

  const tint = Colors.light.tint

  return (
    <Modal
      transparent
      statusBarTranslucent={true}
      animationType="fade"
      visible={true}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>🎉 Puzzle Complete</Text>

          <View style={styles.row}>
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>Time</Text>
              <Text style={styles.timeValue}>{elapsed}</Text>
            </View>

            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>Started</Text>
              <Text style={styles.metaValue}>
                {puzzleState.startedAt
                  ? new Date(puzzleState.startedAt).toLocaleString()
                  : '—'}
              </Text>
            </View>
          </View>

          <Text style={styles.note}>
            Your answers have been saved. You can reset the puzzle or return
            home.
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => {
                onReset()
              }}
              style={[styles.primaryButton, { backgroundColor: tint }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Reset puzzle"
            >
              <Text style={styles.primaryText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(tabs)')}
              style={styles.ghostButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Go home"
            >
              <Text style={styles.ghostText}>Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(16,20,24,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 16,
    backgroundColor: COLOR.white,
    paddingVertical: 20,
    paddingHorizontal: 20,
    // shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLOR.letterText,
    textAlign: 'center',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 10,
  },
  timeBox: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f5f9fb',
    minWidth: 96,
  },
  timeLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLOR.letterText,
  },
  metaBox: {
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderColor: '#e6edf2',
    borderWidth: 1,
    minWidth: 160,
  },
  metaLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  metaValue: {
    fontSize: 13,
    color: '#374151',
  },
  note: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  primaryButton: {
    minWidth: 120,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: COLOR.white,
    fontWeight: '700',
    fontSize: 15,
  },
  ghostButton: {
    minWidth: 120,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
  },
  ghostText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 15,
  },
})
