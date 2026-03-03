import { Tabs } from 'expo-router'
import React from 'react'

import { useColorScheme } from '@/hooks/use-color-scheme'
import { HapticTab } from '@/components/haptic-tab'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { Colors } from '@/constants/theme'
import Ionicons from '@expo/vector-icons/Ionicons'

export default function TabLayout() {
  const colorScheme = useColorScheme()

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
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="import"
        options={{
          title: 'Import',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons size={28} name="download" color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
