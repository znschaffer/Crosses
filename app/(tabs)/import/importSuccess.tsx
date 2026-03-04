import { usePuzzle } from '@/contexts/PuzzleContext'
import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

export default function ImportSuccessScreen() {
  const { state } = usePuzzle()
  const activePuzzle = state.puzzles[state.activePuzzleId ?? 0]
  if (!activePuzzle) router.replace('/(tabs)')
  const clues =
    activePuzzle.puzzle.clues.across.length +
    activePuzzle.puzzle.clues.down.length
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        justifyContent: 'center',
        gap: 24,
        padding: 24,
      }}
    >
      <View style={styles.infoBox}>
        <View>
          <Text style={styles.puzzleTitle}>{activePuzzle.puzzle.title}</Text>
          <Text style={styles.puzzleAuthor}>{activePuzzle.puzzle.author}</Text>
        </View>
        <View style={styles.puzzleStats}>
          <View style={styles.puzzleStat}>
            <Text style={styles.puzzleStatValue}>{clues}</Text>
            <Text style={styles.puzzleStatText}>CLUES</Text>
          </View>
          <View style={styles.puzzleStat}>
            <Text style={styles.puzzleStatValue}>
              ~{Math.floor(clues * 0.2)}
            </Text>
            <Text style={styles.puzzleStatText}>MIN EST.</Text>
          </View>
        </View>
        <View style={styles.puzzleClues}>
          <Text style={{ fontSize: 12, fontWeight: 700 }}>A Few Clues</Text>
          {activePuzzle.puzzle.clues.across.slice(0, 6).map((clue) => (
            <View style={styles.puzzleClue} key={clue.number}>
              <Text style={styles.puzzleClueNumber}>{clue.number}</Text>
              <Text style={styles.puzzleClueText}>{clue.text}</Text>
            </View>
          ))}
        </View>
      </View>
      <TouchableOpacity
        style={styles.startPuzzleButton}
        onPress={() => router.navigate('/(tabs)')}
      >
        <Ionicons color="#fff" name="play"></Ionicons>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 500 }}>
          Start Puzzle
        </Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f3ef',
  },
  puzzleTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#0a0a0a',
  },
  puzzleAuthor: {
    fontSize: 14,
    fontWeight: 400,
    color: '#4a5565',
  },
  puzzleStats: {
    flexDirection: 'row',
    gap: 24,
  },
  puzzleStat: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  startPuzzleButton: {
    backgroundColor: '#e87756',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
  puzzleClues: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    gap: 16,
    backgroundColor: '#f9fafb',
  },
  puzzleClue: {
    flexDirection: 'row',
    gap: 14,
  },
  puzzleClueNumber: {
    color: '#e87756',
    width: 24,
    fontSize: 14,
    fontWeight: 700,
  },
  puzzleClueText: {
    fontSize: 14,
    color: '#101828',
  },
  puzzleStatText: {
    fontSize: 12,
    color: '#4a5565',
    textAlign: 'center',
  },
  puzzleStatValue: {
    fontWeight: 700,
    fontSize: 30,
    textAlign: 'center',
  },
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
})
