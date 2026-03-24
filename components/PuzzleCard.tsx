import { PuzzleState } from '@/types/PuzzleState.t'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

type CompletionStatus = 'complete' | 'in-progress' | 'to-do'

function getCompletionStatus(state: PuzzleState): CompletionStatus {
  if (state.complete) return 'complete'
  if (state.userAnswers.some((a) => a !== '')) return 'in-progress'
  return 'to-do'
}

function getSizeLabel(rows: number, cols: number): string {
  return `${cols}×${rows}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const STATUS_CONFIG: Record<
  CompletionStatus,
  { label: string; color: string }
> = {
  complete: { label: 'DONE', color: '#16a34a' },
  'in-progress': { label: 'IN PROG', color: '#2563eb' },
  'to-do': { label: 'TO DO', color: '#9ca3af' },
}

interface PuzzleCardProps {
  id: string
  state: PuzzleState
  onPress: (id: string) => void
}

const MiniGrid = React.memo(({ puzzle }: { puzzle: PuzzleState['puzzle'] }) => {
  const rows = puzzle.tiles.length
  const cols = puzzle.tiles[0]?.length ?? 0
  if (rows === 0 || cols === 0) return null

  const size = 60
  const maxDim = Math.max(rows, cols)
  const cellSize = size / maxDim

  const width = cols * cellSize
  const height = rows * cellSize

  return (
    <View
      style={{
        width,
        height,
        backgroundColor: '#fff',
        borderWidth: 0,
        borderColor: '#111',
      }}
    >
      {puzzle.tiles.flatMap((row, r) =>
        row.map((cell, c) => {
          if (cell.type === 'blank') {
            return (
              <View
                key={`${r}-${c}`}
                style={{
                  position: 'absolute',
                  top: r * cellSize,
                  left: c * cellSize,
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: '#111',
                }}
              />
            )
          }
          return null
        })
      )}
    </View>
  )
})
MiniGrid.displayName = 'MiniGrid'

export function PuzzleCard({ id, state, onPress }: PuzzleCardProps) {
  const { puzzle } = state
  const status = getCompletionStatus(state)
  const statusConfig = STATUS_CONFIG[status]
  const rows = puzzle.tiles.length
  const cols = puzzle.tiles[0]?.length ?? 0
  const title = puzzle.meta?.title
  const author = puzzle.meta?.author
  const date = puzzle.meta?.date

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(id)}
      activeOpacity={0.7}
    >
      <View style={styles.thumbnail}>
        <MiniGrid puzzle={puzzle} />
      </View>
      <View style={styles.info}>
        {title ? (
          <Text style={styles.filename} numberOfLines={1}>
            {id}
          </Text>
        ) : null}
        <Text style={styles.title} numberOfLines={2}>
          {title ?? id}
        </Text>
        {author ? (
          <Text style={styles.author} numberOfLines={1}>
            by {author}
          </Text>
        ) : null}
        <View style={styles.tags}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{getSizeLabel(rows, cols)}</Text>
          </View>
          {date ? (
            <View style={styles.tag}>
              <Text style={[styles.tagText, { color: '#e87756' }]}>
                {formatDate(date)}
              </Text>
            </View>
          ) : null}
          <View style={styles.tag}>
            <Text style={[styles.tagText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    alignItems: 'center',
  },
  thumbnail: {
    width: 80,
    height: 80,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  thumbnailGrid: {
    width: 60,
    height: 60,
    backgroundColor: '#9ca3af',
    borderRadius: 2,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  filename: {
    fontSize: 11,
    color: '#9ca3af',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0a0a0a',
  },
  author: {
    fontSize: 13,
    color: '#4a5565',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  tag: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
})
