import StreakCard from '@/components/StreakCard'
import { usePuzzle } from '@/contexts/PuzzleContext'
import { usePuzzleLoader } from '@/hooks/usePuzzleLoader'
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

export default function HomeScreen() {
  const { handleLoadPuzzle } = usePuzzleLoader()
  const { state } = usePuzzle()
  const mockStreak = 12
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Crosses</Text>
        <Text style={styles.date}>{today}</Text>
      </View>

      <StreakCard streak={mockStreak} />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today&apos;s Puzzle</Text>
      </View>

      <View style={{ flex: 1 }}>
        <TouchableOpacity style={styles.button} onPress={handleLoadPuzzle}>
          <Text>Load Puzzle</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flex: 3 }}>
        <FlatList
          keyExtractor={(state, index) => {
            return index + (state.puzzle.meta.title ?? '')
          }}
          data={Object.values(state.puzzles)}
          renderItem={({ item }) => (
            <View>
              <Text
                style={{
                  borderColor: 'black',
                  borderWidth: 1,
                  margin: 4,
                  padding: 4,
                }}
              >
                {item.puzzle.meta.title} - {item.puzzle.meta.title}
              </Text>
            </View>
          )}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 40,
    backgroundColor: '#F5F3EF',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#0A0A0A',
  },
  date: {
    marginTop: 4,
    fontSize: 13,
    color: '#4A5565',
  },
  sectionHeader: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0A0A0A',
  },
  button: {
    borderColor: 'black',
    borderWidth: 1,
    padding: 12,
    borderRadius: 20,
  },
})
