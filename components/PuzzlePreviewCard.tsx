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
const rowCounts = [2, 4, 5, 4, 3]

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
        <View style={styles.mockGrid}>
          {rowCounts.map((cellCount, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.mockRow}>
              {Array.from({ length: cellCount }).map((_, cellIndex) => (
                <View
                  key={`cell-${rowIndex}-${cellIndex}`}
                  style={styles.blackCell}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.tagPill}>
        <Text style={styles.tagText}>{tag}</Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.meta} numberOfLines={2}>
        by {author}
      </Text>

      <Text style={styles.sizeText}>{size}</Text>

      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          <Text style={styles.progressBold}>{completionPercent}%</Text> complete
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
  )
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderWidth: 1,
    borderColor: '#F0E5D0',
  },
  previewGrid: {
    height: 120,
    width: 120,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 6,
  },
  mockGrid: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 4,
  },
  mockRow: {
    flexDirection: 'row',
    gap: 4,
  },
  blackCell: {
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: '#101828',
  },
  tagPill: {
    marginTop: 14,
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#FFE8E0',
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
  sizeText: {
    marginTop: 2,
    fontSize: 14,
    color: '#4A5565',
  },
  progressRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    width: '100%',
    marginTop: 20,
    borderRadius: 16,
    backgroundColor: '#E87756',
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
})
