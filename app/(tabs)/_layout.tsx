import { TimedAlert, type TimedAlertState } from '@/components/timed-alert'
import { router, Tabs } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'

import { HapticTab } from '@/components/haptic-tab'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { Colors } from '@/constants/theme'
import { usePuzzle } from '@/contexts/PuzzleContext'
import { useColorScheme } from '@/hooks/use-color-scheme'
import {
  formatSyncSummary,
  loadSyncSources,
  markTnyAutoSyncRanToday,
  syncRecentTnyPuzzles,
  shouldRunTnyAutoSyncToday,
} from '@/services/syncSettings'
import Ionicons from '@expo/vector-icons/Ionicons'
import { TouchableOpacity, View } from 'react-native'

export default function TabLayout() {
  const colorScheme = useColorScheme()
  const { activePuzzle, loadPuzzleFile, state } = usePuzzle()
  const autoSyncTriedRef = useRef(false)
  const [alert, setAlert] = useState<TimedAlertState | null>(null)

  const showAlert = (message: string, tone: TimedAlertState['tone']) => {
    setAlert({ id: Date.now(), message, tone })
  }

  useEffect(() => {
    if (autoSyncTriedRef.current) {
      return
    }

    autoSyncTriedRef.current = true

    const runAutoSync = async () => {
      const syncSources = await loadSyncSources()

      if (!syncSources.tny) {
        return
      }

      const shouldRun = await shouldRunTnyAutoSyncToday()
      if (!shouldRun) {
        console.log('[AutoSync] Skipping tny auto-sync (already synced today)')
        showAlert('Auto-sync skipped: already synced today.', 'info')
        return
      }

      try {
        console.log('[AutoSync] Running tny auto-sync')
        const result = await syncRecentTnyPuzzles({
          days: 30,
          existingPuzzleIds: new Set(Object.keys(state.puzzles)),
          loadPuzzleFile,
        })
        if (!__DEV__) {
          await markTnyAutoSyncRanToday()
        }
        showAlert(
          formatSyncSummary(result, 'Auto-sync complete'),
          result.failed > 0 ? 'info' : 'success'
        )
        console.log('[AutoSync] tny auto-sync complete')
      } catch (error) {
        console.error('[AutoSync] tny auto-sync failed', error)
        showAlert('Auto-sync failed.', 'error')
      }
    }

    runAutoSync()
  }, [loadPuzzleFile, state.puzzles])

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerBackButtonDisplayMode: 'minimal',
          tabBarButton: HapticTab,
        }}
        backBehavior="firstRoute"
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="house.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="archive"
          options={{
            title: 'Archive',
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <Ionicons size={28} name="archive" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="grid"
          options={{
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.navigate('/(tabs)')}
                hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                style={{ marginLeft: 8 }}
              >
                <Ionicons name="chevron-back" size={24} color="#197602" />
              </TouchableOpacity>
            ),
            title: activePuzzle?.puzzle.meta?.title ?? 'Grid',
            tabBarIcon: ({ color }) => (
              <Ionicons size={28} name="play" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="import"
          options={{
            title: 'Import',
            tabBarIcon: ({ color }) => (
              <Ionicons size={28} name="download" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => (
              <Ionicons size={28} name="person" color={color} />
            ),
          }}
        />
      </Tabs>
      <TimedAlert alert={alert} onHide={() => setAlert(null)} />
    </View>
  )
}
