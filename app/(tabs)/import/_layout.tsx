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
          title: 'Import Success',
          headerBackTitle: 'Import',
        }}
      />
      <Stack.Screen
        name="importFail"
        options={{
          title: 'Input Fail',
          headerBackTitle: 'Import',
        }}
      />
    </Stack>
  )
}
