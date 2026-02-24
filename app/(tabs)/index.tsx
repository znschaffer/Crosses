import { usePuzzle } from '@/contexts/PuzzleContext'
import { usePuzzleLoader } from '@/hooks/usePuzzleLoader'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function HomeScreen() {
  const { handleLoadPuzzle } = usePuzzleLoader()
  const { state } = usePuzzle()

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={handleLoadPuzzle}>
        <Text>Load Puzzle</Text>
      </TouchableOpacity>
      {state.current && (
        <View>
          <Text>
            {state.current.puzzle.title} - {state.current.puzzle.author}
          </Text>
          <Text>
            {state.current.puzzle.clues.across.at(0)?.number} -{' '}
            {state.current.puzzle.clues.across.at(0)?.text}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    borderColor: 'black',
    borderWidth: 1,
    padding: 12,
    borderRadius: 20,
  },
})
