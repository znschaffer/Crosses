import { router, Tabs } from 'expo-router'
import React from 'react'

import { HapticTab } from '@/components/haptic-tab'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { Colors } from '@/constants/theme'
import { usePuzzle } from '@/contexts/PuzzleContext'
import { useColorScheme } from '@/hooks/use-color-scheme'
import Ionicons from '@expo/vector-icons/Ionicons'
import { TouchableOpacity } from 'react-native'

export default function TabLayout() {
  const colorScheme = useColorScheme()
  const { activePuzzle } = usePuzzle()

  return (
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
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons size={28} name="person" color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
