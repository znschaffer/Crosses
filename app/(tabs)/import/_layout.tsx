import { Stack } from 'expo-router'

export default function ImportTabLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Import',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="importSuccess"
        options={{
          title: '',
          headerBackTitle: 'Import',
        }}
      />
    </Stack>
  )
}
