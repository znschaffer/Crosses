import { StyleSheet, Text, View } from 'react-native'
type StreakCardProps = {
  streak: number
}

export default function StreakCard({ streak }: StreakCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.streakNumber}>{streak}</Text>
      <Text style={styles.label}>DAY</Text>
      <Text style={styles.label}>STREAK</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    marginTop: 10,
    borderRadius: 24,
    borderColor: '#F0E5D0',
    backgroundColor: '#FFF9F0',
  },
  streakNumber: {
    fontSize: 36,
    color: '#D4A574',
    fontWeight: 700,
  },
  label: {
    fontSize: 12,
    color: '#4A5565',
    fontWeight: 500,
  },
})
