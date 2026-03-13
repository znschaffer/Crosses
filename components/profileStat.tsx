import { useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'

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
  const [puzzlesCompleted, setPuzzlesCompleted] = useState(100)
  const [averageTime, setAverageTime] = useState('18:42')
  const [bestStreak, setBestStreak] = useState(10)

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
            setPuzzlesCompleted(0)
            setAverageTime('00:00')
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
        <Text style={styles.statValue}>{averageTime}</Text>
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
