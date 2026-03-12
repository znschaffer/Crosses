import HomeProfileMenu from '@/components/HomeProfileMenu'
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
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Crosses</Text>
          <Text style={styles.date}>{today}</Text>
        </View>
        <HomeProfileMenu />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
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
  profileIcon: {
    width: 48,
    height: 48,
    margin: 10,
    borderRadius: 22,
    backgroundColor: '#F6DCD2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E87756',
  },
  sectionHeader: {
    marginTop: 28,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0A0A0A',
    lineHeight: 28,
  },
  button: {
    borderColor: 'black',
    borderWidth: 1,
    padding: 12,
    borderRadius: 20,
  },
})
