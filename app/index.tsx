import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
export default function Landing() {
  const router = useRouter()

  return (
    <LinearGradient
      colors={['#E87756', '#D4A574']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <Pressable
          style={styles.container}
          onPress={() => router.replace('/(tabs)')}
        >
          <View style={styles.content}>
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.title}>Crosses</Text>
            <Text style={styles.tagline}>Your Daily Crossword Companion</Text>
          </View>
        </Pressable>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#E87756',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    width: 190,
    height: 190,
    marginBottom: -45,
  },
  title: {
    fontSize: 48,
    fontFamily: 'Inter_700Bold',
    color: 'white',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 20,
    fontFamily: 'Inter_400Regular',
    color: 'white',
    textAlign: 'center',
  },
})
