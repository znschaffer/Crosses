import Ionicons from '@expo/vector-icons/Ionicons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import ImagePicker from 'expo-image-picker'
import React, { useState } from 'react'
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

/**
 * @typedef {Object} ProfileHeaderProps
 * @property {string | null} avatarUri - The current URI for the user's profile image.
 * @property {Function} setAvatarUri - update the avatar URI.
 * @property {string} firstName - The user's first name.
 * @property {Function} setFirstName - update user's first name.
 * @property {string} lastName - The user's last name.
 * @property {Function} setLastName - update user's last name.
 * @property {number} streak - the current daily streak count.
 */

/**
 * Displays the user's avatar, first name, last name, and streak.
 * @param {ProfileHeaderProps} props - The props parameter for profile header
 * @returns {JSX.Element} The profile header
 */
export function ProfileHeader({
  avatarUri,
  setAvatarUri,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  streak,
}: any) {
  // Local initial state for editing first and last name.
  const [tempFirst, setTempFirst] = useState(firstName)
  const [tempLast, setTempLast] = useState(lastName)

  // Local initial state for modal visibility
  const [modalVisible, setModalVisible] = useState(false)

  // Fallback to Avatar Initials (If avatar image is removed)
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()

  // function to launch Image Picker.
  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (permissionResult.granted === false) {
      alert('You need to allow this app to access your photos')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    })

    // If image is selected, updates state and persist URI to AsyncStorage
    if (!result.canceled) {
      const uri = result.assets[0].uri
      setAvatarUri(uri)
      await AsyncStorage.setItem('@user_avatar', uri)
    }
  }

  // function to remove avatar
  const handleRemoveAvatar = async () => {
    setAvatarUri(null)
    await AsyncStorage.removeItem('@user_avatar')
  }

  // function to open the edit modal
  const handleOpenModal = () => {
    setTempFirst(firstName)
    setTempLast(lastName)
    setModalVisible(true)
  }

  // function to save first and last name
  const handleSave = async () => {
    setFirstName(tempFirst)
    setLastName(tempLast)

    try {
      await AsyncStorage.setItem('@first_name', tempFirst)
      await AsyncStorage.setItem('@last_name', tempLast)
    } catch (e) {
      console.error('Error saving name', e)
    }
    setModalVisible(false)
  }

  return (
    <View style={styles.userRow}>
      {/* AVATAR */}
      <TouchableOpacity style={styles.avatar} onPress={pickImage}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.initials}>{initials}</Text>
        )}
      </TouchableOpacity>

      {/* FIRST AND LAST NAME */}
      <View>
        <View style={styles.nameRow}>
          <TouchableOpacity onPress={handleOpenModal}>
            <Text>
              <Text style={styles.usernameInput}>
                {firstName} {lastName}{' '}
              </Text>
              <Ionicons name="pencil-outline" size={16} />
            </Text>
          </TouchableOpacity>
        </View>

        {/* CURRENT DAY STREAK */}
        <Text style={styles.streak}>{streak} day streak</Text>
      </View>

      {/* MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false)
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.heading}>Edit Profile</Text>

            <TextInput
              style={styles.modalInput}
              value={tempFirst}
              onChangeText={setTempFirst}
              placeholder="FirstName"
              placeholderTextColor={'#999'}
            />
            <TextInput
              style={styles.modalInput}
              value={tempLast}
              onChangeText={setTempLast}
              placeholder="LastName"
              placeholderTextColor={'#999'}
            />

            {avatarUri && (
              <View style={{ width: '100%', margin: 15 }}>
                <TouchableOpacity
                  style={[styles.button, { flex: 0, alignItems: 'center' }]}
                  onPress={handleRemoveAvatar}
                >
                  <Text style={styles.buttonText}> Remove Avatar</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.buttonLayout}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleSave}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

/**
 * StyleSheet for ProfileHeader
 */
const styles = StyleSheet.create({
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F4D1C0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },

  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  button: {
    flex: 1,
    backgroundColor: '#e87756',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },

  buttonLayout: {
    flexDirection: 'row',
    gap: 12,
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'semibold',
  },

  heading: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  initials: {
    color: '#e87756',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
  },

  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 5,
    marginTop: '50%',
  },

  modalInput: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    fontSize: 16,
    paddingVertical: 8,
    marginBottom: 20,
    color: '#000',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },

  nameRow: {
    flexDirection: 'row',
    gap: 4,
  },

  streak: {
    color: '#666',
  },

  username: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 20,
  },

  usernameInput: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 20,
    minWidth: 50,
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
})
