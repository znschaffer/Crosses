import { usePuzzle } from '@/contexts/PuzzleContext'
import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import { useEffect } from 'react'
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native'

export default function ImportSuccessScreen() {
  const { activePuzzle } = usePuzzle()

  useEffect(() => {
    if (!activePuzzle?.puzzle) router.replace('/(tabs)')
  }, [activePuzzle])

  if (!activePuzzle?.puzzle) return null

  const { puzzle } = activePuzzle

  // xd-crossword-tools: metadata in puzzle.meta, clue text in clue.body
  const title = puzzle.meta?.title ?? 'Untitled'
  const author = puzzle.meta?.author ?? ''
  const acrossClues = Array.isArray(puzzle.clues?.across)
    ? puzzle.clues.across
    : []
  const downClues = Array.isArray(puzzle.clues?.down) ? puzzle.clues.down : []
  const clueCount = acrossClues.length + downClues.length

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ justifyContent: 'center', gap: 24, padding: 24 }}
    >
      <View style={styles.infoBox}>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text style={styles.puzzleTitle}>{title}</Text>
          {!!author && <Text style={styles.puzzleAuthor}>{author}</Text>}
        </View>

        <View style={styles.puzzleStats}>
          <View style={styles.puzzleStat}>
            <Text style={styles.puzzleStatValue}>{clueCount}</Text>
            <Text style={styles.puzzleStatText}>CLUES</Text>
          </View>
          <View style={styles.puzzleStat}>
            <Text style={styles.puzzleStatValue}>
              ~{Math.floor(clueCount * 0.2)}
            </Text>
            <Text style={styles.puzzleStatText}>MIN EST.</Text>
          </View>
        </View>

        <View style={styles.puzzleClues}>
          <Text style={{ fontSize: 12, fontWeight: '700' }}>A Few Clues</Text>
          {acrossClues.slice(0, 6).map((clue) => (
            <View style={styles.puzzleClue} key={clue.number}>
              <Text style={styles.puzzleClueNumber}>{clue.number}</Text>
              <Text style={styles.puzzleClueText}>{clue.body}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.startPuzzleButton}
        onPress={() => router.push('/(tabs)')}
      >
        <Ionicons color="#fff" name="play" />
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '500' }}>
          Start Puzzle
        </Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f3ef' },
  infoBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
  },
  puzzleTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0a0a0a',
    textAlign: 'center',
  },
  puzzleAuthor: { fontSize: 14, fontWeight: '400', color: '#4a5565' },
  puzzleStats: { flexDirection: 'row', gap: 24 },
  puzzleStat: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  puzzleStatValue: { fontWeight: '700', fontSize: 30, textAlign: 'center' },
  puzzleStatText: { fontSize: 12, color: '#4a5565', textAlign: 'center' },
  puzzleClues: {
    alignSelf: 'stretch',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    backgroundColor: '#f9fafb',
  },
  puzzleClue: { flexDirection: 'row', gap: 14 },
  puzzleClueNumber: {
    color: '#e87756',
    width: 24,
    fontSize: 14,
    fontWeight: '700',
  },
  puzzleClueText: { fontSize: 14, color: '#101828', flex: 1 },
  startPuzzleButton: {
    backgroundColor: '#e87756',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
})
