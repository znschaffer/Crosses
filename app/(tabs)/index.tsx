import { usePuzzle } from '@/contexts/PuzzleContext'
import { usePuzzleLoader } from '@/hooks/usePuzzleLoader'
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
} from 'react-native'

export default function HomeScreen() {
  const { handleLoadPuzzle } = usePuzzleLoader()
  const { state } = usePuzzle()

  return (
    <View style={styles.container}>
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
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: 'black',
    borderWidth: 1,
  },
  button: {
    borderColor: 'black',
    borderWidth: 1,
    padding: 12,
    borderRadius: 20,
  },
})
