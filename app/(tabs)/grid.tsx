import React from 'react'
import { View, Text } from 'react-native'
import { usePuzzle } from '@/contexts/PuzzleContext'
import GridInner from '@/components/grid-inner'

export default function GridScreen() {
  const { activePuzzle } = usePuzzle()

  if (!activePuzzle) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No active puzzle</Text>
      </View>
    )
  }

  // Key ensures GridInner remounts when a different puzzle is activated,
  // so its local state initializes cleanly.
  const key =
    activePuzzle.puzzle.meta.title ?? activePuzzle.startedAt ?? 'puzzle'

  return <GridInner key={key} puzzleState={activePuzzle} />
}
