import { useEffect, useRef } from 'react'
import {
  Animated,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

export type TimedAlertState = {
  id: number
  message: string
  tone: 'success' | 'error' | 'info'
}

type TimedAlertProps = {
  alert: TimedAlertState | null
  onHide: () => void
  containerStyle?: StyleProp<ViewStyle>
}

export function TimedAlert({ alert, onHide, containerStyle }: TimedAlertProps) {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(-24)).current

  useEffect(() => {
    if (!alert) {
      return
    }

    let hideTimer: ReturnType<typeof setTimeout> | null = null

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start()

    hideTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -24,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => onHide())
    }, 3000)

    return () => {
      if (hideTimer) {
        clearTimeout(hideTimer)
      }
    }
  }, [alert, onHide, opacity, translateY])

  if (!alert) {
    return null
  }

  const toneStyle =
    alert.tone === 'success'
      ? styles.success
      : alert.tone === 'error'
        ? styles.error
        : styles.info

  return (
    <View pointerEvents="none" style={[styles.container, containerStyle]}>
      <Animated.View
        style={[
          styles.alert,
          toneStyle,
          { opacity, transform: [{ translateY }] },
        ]}
      >
        <Text style={styles.text}>{alert.message}</Text>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  alert: {
    borderRadius: 0,
    paddingVertical: 10,
    paddingHorizontal: 14,
    width: '100%',
  },
  success: {
    backgroundColor: '#f3fdf2',
  },
  error: {
    backgroundColor: '#fdf2f8',
  },
  info: {
    backgroundColor: '#f3fdf2',
  },
  text: {
    color: '#0a0a0a',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: 600,
  },
})
