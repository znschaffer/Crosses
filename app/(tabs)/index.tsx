import HomeProfileMenu from '@/components/HomeProfileMenu'
import PuzzlePreviewCard from '@/components/PuzzlePreviewCard'
import StreakCard from '@/components/StreakCard'
import { usePuzzle } from '@/contexts/PuzzleContext'
import { router } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'

export default function HomeScreen() {
  const { activePuzzle } = usePuzzle()
  const mockStreak = 12
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const completionPercent = activePuzzle
    ? Math.round(
        (activePuzzle.userAnswers.filter((cell) => cell !== '').length /
          activePuzzle.userAnswers.length) *
          100
      )
    : 0

  const getElapsedTime = (startedAt?: string) => {
    if (!startedAt) return '0:00'

    const start = new Date(startedAt).getTime()
    const now = Date.now()
    const diffMs = now - start
    const totalSeconds = Math.floor(diffMs / 1000)

    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60

    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

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

      {activePuzzle ? (
        <PuzzlePreviewCard
          title={activePuzzle.puzzle.meta?.title ?? 'Untitled Puzzle'}
          author={activePuzzle.puzzle.meta?.author ?? 'Unknown Author'}
          size={`${activePuzzle.puzzle.tiles.length}×${activePuzzle.puzzle.tiles[0]?.length ?? 0}`}
          completionPercent={completionPercent}
          elapsedTime={getElapsedTime(activePuzzle.startedAt)}
          tag="• DAILY CLASSIC"
          onPress={() => router.navigate('/(tabs)/grid')}
        />
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No puzzle loaded</Text>

          <Pressable
            style={styles.loadButton}
            onPress={() => router.navigate('/import')}
          >
            <Text style={styles.loadButtonText}>Import Puzzle</Text>
          </Pressable>
        </View>
      )}
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
  emptyCard: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#F0E5D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A0A0A',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#4A5565',
    textAlign: 'center',
  },
  loadButton: {
    marginTop: 20,
    backgroundColor: '#E87756',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
})
