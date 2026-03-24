import { ProfileHeader } from '@/components/profileHeader'
import { ProfileStat } from '@/components/profileStat'
import { usePuzzle } from '@/contexts/PuzzleContext'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native'

/**
 * Displays Profile page
 * @returns profile page
 */
export default function ProfileScreen() {
  // local initial state for settings
  const { state, setSettings } = usePuzzle()
  const timer = state.settings.timerEnabled
  const autoCheck = state.settings.autoCheckEnabled
  const hints = state.settings.hintsEnabled

  // local initial state for streak
  const [streak, setStreak] = useState(10)

  // local initial state for avatar
  const [avatarUri, setAvatarUri] = useState<string | null>(null)

  // local initial state for first and last name
  const [firstName, setFirstName] = useState('Jane')
  const [lastName, setLastName] = useState('Doe')

  const toggleTimer = async () => {
    setSettings({ timerEnabled: !timer })
  }

  const toggleAutoCheck = async () => {
    setSettings({ autoCheckEnabled: !autoCheck })
  }

  const toggleHints = async () => {
    setSettings({ hintsEnabled: !hints })
  }

  // Hook to grab saved profile data from Async Storage
  useEffect(() => {
    // Helper function to pull saved data from phone's memory
    const loadProfileData = async () => {
      try {
        const [savedAvatar, savedFirst, savedLast] = await Promise.all([
          AsyncStorage.getItem('@user_avatar'),
          AsyncStorage.getItem('@first_name'),
          AsyncStorage.getItem('@last_name'),
        ])
        if (savedAvatar !== null) {
          setAvatarUri(savedAvatar)
        }

        if (savedFirst !== null) {
          setFirstName(savedFirst)
        }

        if (savedLast !== null) {
          setLastName(savedLast)
        }
      } catch (e) {
        console.error('Error loading profile data', e)
      }
    }
    loadProfileData()
  }, [])

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f5f3ef' }}
      contentContainerStyle={styles.contentContainer}
    >
      {/* TOP CONTAINER */}
      <View style={styles.container}>
        {/* PROFILE HEADER */}
        <ProfileHeader
          avatarUri={avatarUri}
          setAvatarUri={setAvatarUri}
          firstName={firstName}
          setFirstName={setFirstName}
          lastName={lastName}
          setLastName={setLastName}
          streak={streak}
        />

        {/* PROFILE STAT */}
        <ProfileStat streak={streak} setStreak={setStreak} />
      </View>

      {/* BOTTOM CONTAINER */}
      <View style={styles.bottomcontainer}>
        {/* SETTINGS */}
        <Text style={styles.header}>Settings</Text>
        <View style={styles.stat}>
          <Text>Enable Auto-check</Text>
          <Switch
            trackColor={{ false: '#f5f3ef', true: '#4CAF50' }}
            thumbColor="#fff"
            ios_backgroundColor="#f5f3ef"
            onValueChange={toggleAutoCheck}
            value={autoCheck}
          />
        </View>
        <View style={styles.stat}>
          <Text>Enable Timer</Text>
          <Switch
            trackColor={{ false: '#f5f3ef', true: '#4CAF50' }}
            thumbColor="#fff"
            ios_backgroundColor="#f5f3ef"
            onValueChange={toggleTimer}
            value={timer}
          />
        </View>
        <View style={styles.stat}>
          <Text>Enable Hints</Text>
          <Switch
            trackColor={{ false: '#f5f3ef', true: '#4CAF50' }}
            thumbColor="#fff"
            ios_backgroundColor="#f5f3ef"
            onValueChange={toggleHints}
            value={hints}
          />
        </View>
      </View>
    </ScrollView>
  )
}

/**
 * StyleSheet for Profile Page
 */
const styles = StyleSheet.create({
  bottomcontainer: {
    backgroundColor: '#fff',
    alignSelf: 'center',
    borderRadius: 24,
    padding: 34,
  },

  container: {
    backgroundColor: '#fff',
    alignSelf: 'center',
    borderRadius: 24,
    padding: 34,
    gap: 12,
  },

  contentContainer: {
    justifyContent: 'center',
    gap: 24,
    padding: 24,
  },

  header: {
    color: '#0a0a0a',
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'center',
    paddingHorizontal: 12,
    marginBottom: 24,
  },

  headerbar: {
    color: '#0a0a0a',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'left',
    marginTop: 60,
    marginLeft: 20,
  },

  stat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    width: '100%',
  },
})
