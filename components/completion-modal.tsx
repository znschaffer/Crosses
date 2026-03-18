import { PuzzleState } from '@/types/PuzzleState.t'
import { router } from 'expo-router'
import { StyleSheet, Modal, Text, TouchableOpacity, View } from 'react-native'

export default function CompletionModal({
  puzzleState,
  onReset,
}: {
  puzzleState: PuzzleState
  onReset: () => void
}) {
  return (
    <Modal
      backdropColor={'#cccccc00'}
      statusBarTranslucent={true}
      navigationBarTranslucent={true}
      animationType="fade"
      visible={true}
    >
      <View style={styles.completionModal}>
        <Text>Puzzle Complete!</Text>
        <Text>
          Time:
          {puzzleState.finishedAt &&
            (new Date(puzzleState.finishedAt).getTime() -
              new Date(puzzleState.startedAt).getTime()) /
              1000}
          seconds
        </Text>
        <View style={{ flexDirection: 'row', gap: 12, padding: 12 }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#4CAF50',
              borderRadius: 8,
              justifyContent: 'center',
              height: 36,
              width: 64,
              alignItems: 'center',
            }}
            onPress={onReset}
          >
            <Text style={{ color: 'white' }}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              backgroundColor: '#4CAF50',
              borderRadius: 8,
              justifyContent: 'center',
              height: 36,
              width: 64,
              alignItems: 'center',
            }}
            onPress={() => {
              router.navigate('/(tabs)')
            }}
          >
            <Text style={{ color: 'white' }}>Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  completionModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    maxHeight: '50%',
    borderRadius: 16,
    width: '80%',
    margin: 'auto',
  },
})
