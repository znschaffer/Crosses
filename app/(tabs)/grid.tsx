import React, { useEffect } from 'react'
import { View, Text } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { usePuzzle } from '@/contexts/PuzzleContext'
import GridInner from '@/components/grid-inner'

function formatMsAsClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000))
  const s = totalSeconds % 60
  const m = Math.floor((totalSeconds % 3600) / 60)
  const h = Math.floor(totalSeconds / 3600)
  const two = (n: number) => String(n).padStart(2, '0')
  if (h > 0) return `${h}:${two(m)}:${two(s)}`
  return `${m}:${two(s)}`
}
export default function GridScreen() {
  const { activePuzzle, state } = usePuzzle()

  const navigation = useNavigation()

  useEffect(() => {
    if (!state?.settings?.timerEnabled || !activePuzzle) {
      navigation.setOptions({ headerRight: undefined })
      return
    }

    const pushHeader = () => {
      const base = activePuzzle.activeMs ?? 0
      const running = activePuzzle.focusStartedAt
        ? Math.max(
            0,
            Date.now() - new Date(activePuzzle.focusStartedAt).getTime()
          )
        : 0
      const total = base + running
      const label = formatMsAsClock(total)
      navigation.setOptions({
        headerRight: () => (
          <Text
            style={{
              marginRight: 12,
              fontSize: 15,
              fontWeight: '600',
              color: '#111',
            }}
          >
            {label}
          </Text>
        ),
      })
    }

    pushHeader()

    if (activePuzzle.complete) return
    const id = setInterval(pushHeader, 1000)
    return () => clearInterval(id)
  }, [activePuzzle, navigation, state?.settings?.timerEnabled])
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
