import { Pressable, StyleSheet, Text, View } from 'react-native'

type PuzzlePreviewCardProps = {
  title: string
  author?: string
  size?: string
  completionPercent?: number
  elapsedTime?: string
  tag?: string
  onPress: () => void
}

export default function PuzzlePreviewCard({
  title,
  author = 'Unknow Author',
  size = '15x15',
  completionPercent = 0,
  elapsedTime = '0:00',
  tag = 'DAILY CLASSIC',
  onPress,
}: PuzzlePreviewCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.previewGrid}>
        <Text style={styles.previewPlaceholder}>PUZZLE</Text>

        <View style={styles.tagPill}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>
          by {author} {size}
        </Text>

        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            <Text style={styles.progressBold}>{completionPercent}%</Text>{' '}
            complete
          </Text>
          <Text style={styles.elapsedText}>{elapsedTime} elapsed</Text>
        </View>

        <View style={styles.progressBarBackground}>
          <View
            style={[styles.progressBarFill, { width: `${completionPercent}%` }]}
          />
        </View>

        <Pressable style={styles.button} onPress={onPress}>
          <Text style={styles.buttonText}>▶ Continue Puzzle</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0E5D0',
  },
  previewGrid: {
    height: 180,
    borderRadius: 16,
    backgroundColor: '#F7F7F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewPlaceholder: {
    fontSize: 18,
    fontWeight: '600',
    color: '#101828',
  },
  tagPill: {
    marginTop: 16,
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#F8DDD5',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E87756',
  },
  title: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#0A0A0A',
  },
  meta: {
    marginTop: 8,
    fontSize: 14,
    color: '#4A5565',
  },
  progressRow: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 14,
    color: '#4A5565',
  },
  progressBold: {
    fontWeight: '700',
    color: '#0A0A0A',
  },
  elapsedText: {
    fontSize: 14,
    color: '#E87756',
    fontWeight: '600',
  },
  progressBarBackground: {
    marginTop: 12,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#EAEAEA',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#E87756',
  },
  button: {
    marginTop: 20,
    borderRadius: 16,
    backgroundColor: '#E87756',
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
})
