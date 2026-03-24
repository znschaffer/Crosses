import { usePuzzle } from '@/contexts/PuzzleContext'
import { useEffect, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { formatMsAsClock } from '@/utils/time'

/**
 * @typedef {Object} ProfileStatProps
 * @property {number} streak - The user's current daily streak
 * @property {Function} setStreak - Setter to reset streak to zero.
 */

/**
 * Displays metrics and allows to reset stats.
 * @param {ProfileStatProps} props - The props parameter for profile stat
 * @returns {JSX.Element} The stats
 */
export function ProfileStat({ streak, setStreak }: any) {
  // local initial state for stats
  const { state } = usePuzzle()

  const [puzzlesCompleted, setPuzzlesCompleted] = useState(0)
  const [averageTime, setAverageTime] = useState(0)
  const [bestStreak, setBestStreak] = useState(10)

  useEffect(() => {
    const completedCount = Object.entries(state.puzzles).reduce(
      (prev, curr) => {
        if (curr[1].complete) {
          return prev + 1
        } else {
          return prev
        }
      },
      0
    )
    setPuzzlesCompleted(completedCount)

    const avgTime = Object.entries(state.puzzles).reduce((prev, curr) => {
      if (curr[1].complete) {
        return prev + curr[1].activeMs
      } else {
        return prev
      }
    }, 0)

    setAverageTime(completedCount > 0 ? avgTime / completedCount : 0)
  }, [state])

  // function to reset stats
  const handleResetStats = () => {
    Alert.alert(
      'Reset Stats',
      'Are you sure you want to clear your progress?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            Object.entries(state.puzzles).forEach((p) => {
              p[1].complete = false
            })
            setPuzzlesCompleted(0)
            setAverageTime(0)
            setBestStreak(0)
            setStreak(0)
          },
        },
      ]
    )
  }

  return (
    <View style={styles.statWrapper}>
      <View style={styles.statsRow}>
        <Text>Puzzles Completed</Text>
        <Text style={styles.statValue}>{puzzlesCompleted}</Text>
      </View>

      <View style={styles.statsRow}>
        <Text>Average Time</Text>
        <Text style={styles.statValue}>{formatMsAsClock(averageTime)}</Text>
      </View>

      <View style={styles.statsRow}>
        <Text>Best Streak</Text>
        <Text style={styles.statValue}>{bestStreak} days</Text>
      </View>

      <Pressable style={styles.button} onPress={handleResetStats}>
        <Text style={styles.buttonText}>Reset Stats</Text>
      </Pressable>
    </View>
  )
}

/**
 * Stylesheet for ProfileStat
 */
const styles = StyleSheet.create({
  button: {
    backgroundColor: '#e87756',
    paddingVertical: 16,
    paddingHorizontal: 80,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'semibold',
    fontSize: 16,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    width: '100%',
  },

  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  statWrapper: {
    width: '100%',
  },
})
