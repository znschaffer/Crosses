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
    width: '100%',
    minHeight: 120,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#F0E5D0',
    backgroundColor: '#FFF9F0',
    paddingTop: 20,
    paddingRight: 26,
    paddingBottom: 20,
    paddingLeft: 26,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: '#D4A574',
    lineHeight: 40,
  },
  label: {
    fontSize: 12,
    color: '#4A5565',
    fontWeight: '500',
    fontStyle: 'normal',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
})
