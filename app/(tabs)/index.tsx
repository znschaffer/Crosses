import HomeProfileMenu from '@/components/HomeProfileMenu'
import PuzzlePreviewCard from '@/components/PuzzlePreviewCard'
import StreakCard from '@/components/StreakCard'
import { usePuzzle } from '@/contexts/PuzzleContext'
import { calculateDailyStreak } from '@/utils/streak'
import { formatElapsedTime } from '@/utils/time'
import { router } from 'expo-router'
import { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

export default function HomeScreen() {
  const { activePuzzle, state } = usePuzzle()

  const streak = useMemo(() => {
    return calculateDailyStreak(state.puzzles)
  }, [state.puzzles])

  const completionPercent = useMemo(() => {
    if (!activePuzzle) return 0
    return Math.round(
      (activePuzzle.userAnswers.filter((cell) => cell !== '').length /
        activePuzzle.userAnswers.length) *
        100
    )
  }, [activePuzzle])

  const puzzleSize = useMemo(() => {
    if (!activePuzzle?.puzzle.tiles?.length) return 'Unknow size'
    const rows = activePuzzle.puzzle.tiles.length
    const cols = activePuzzle.puzzle.tiles[0]?.length ?? 0
    return cols > 0 ? `${rows}×${cols}` : 'Unknown size'
  }, [activePuzzle])

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Crosses</Text>
          <Text style={styles.date}>{today}</Text>
        </View>
        <HomeProfileMenu />
      </View>
      <StreakCard streak={streak} />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today&apos;s Puzzle</Text>
      </View>

      {activePuzzle ? (
        <PuzzlePreviewCard
          title={activePuzzle.puzzle.meta?.title ?? 'Untitled Puzzle'}
          author={activePuzzle.puzzle.meta?.author ?? 'Unknown Author'}
          size={puzzleSize}
          completionPercent={completionPercent}
          elapsedTime={formatElapsedTime(activePuzzle.startedAt)}
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
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 48,
    paddingHorizontal: 24,
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
