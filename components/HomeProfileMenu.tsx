import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from '@react-navigation/native'
import { router } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

export default function HomeProfileMenue() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [firstName, setFirstName] = useState('Jane')
  const [lastName, setLastName] = useState('Doe')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)

  const loadProfileData = async () => {
    try {
      const [savedAvatar, savedFirst, savedLast] = await Promise.all([
        AsyncStorage.getItem('@user_avatar'),
        AsyncStorage.getItem('@first_name'),
        AsyncStorage.getItem('@last_name'),
      ])

      if (savedAvatar !== null) setAvatarUri(savedAvatar)
      else setAvatarUri(null)

      if (savedFirst !== null) setFirstName(savedFirst)
      else setFirstName('Jane')

      if (savedLast !== null) setLastName(savedLast)
      else setLastName('Doe')
    } catch (e) {
      console.error('Error loading profile data', e)
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadProfileData()
    }, [])
  )

  const initials = useMemo(() => {
    const first = firstName?.charAt(0) ?? ''
    const last = lastName?.charAt(0) ?? ''
    return `${first}${last}`.toUpperCase()
  }, [firstName, lastName])

  // profile tab will be added
  const handleGoToProfile = () => {
    setMenuOpen(false)
    router.navigate('/(tabs)/profile')
  }

  return (
    <View style={styles.wrapper}>
      <Pressable
        style={styles.avatarButton}
        onPress={() => setMenuOpen((prev) => !prev)}
      >
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>{initials}</Text>
        )}
      </Pressable>

      {menuOpen && (
        <View style={styles.menuCard}>
          <View style={styles.topRow}>
            <View style={styles.menuAvatar}>
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={styles.menuAvatarImage}
                />
              ) : (
                <Text style={styles.menuAvatarText}>{initials}</Text>
              )}
            </View>

            <View style={styles.textBlock}>
              <Text style={styles.nameText}>
                {firstName} {lastName}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity onPress={handleGoToProfile}>
            <Text style={styles.profileLink}>Go to Profile →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  avatarButton: {
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: '#F4D1C0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#E87756',
    fontSize: 14,
    fontWeight: '700',
  },
  menuCard: {
    position: 'absolute',
    top: 56,
    right: 0,
    width: 240,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#F0E5D0',
    backgroundColor: '#FFFDF9',
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    zIndex: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuAvatar: {
    width: 60,
    height: 60,
    borderRadius: 28,
    backgroundColor: '#F4D1C0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  menuAvatarImage: {
    width: '100%',
    height: '100%',
  },
  menuAvatarText: {
    color: '#E87756',
    fontSize: 20,
    fontWeight: '700',
  },
  textBlock: {
    flex: 1,
  },
  nameText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#E6D8C2',
    marginVertical: 16,
  },
  profileLink: {
    color: '#E87756',
    fontSize: 16,
    fontWeight: '600',
  },
})
