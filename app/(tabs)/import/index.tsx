import { usePuzzle } from '@/contexts/PuzzleContext'
import { usePuzzleLoader } from '@/hooks/usePuzzleLoader'
import { syncPuzzle } from '@/services/puzzleSync'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import Ionicons from '@expo/vector-icons/Ionicons'
import { openBrowserAsync } from 'expo-web-browser'
import { useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

export default function ImportScreen() {
  const { handleLoadPuzzle } = usePuzzleLoader()
  const { loadPuzzleFile } = usePuzzle()
  const [syncSources, setSyncSources] = useState({
    nyt: false,
    lat: false,
    usa: false,
    club: false,
  })

  const sources = [
    { key: 'nyt', name: 'New York Times', code: 'nyt' },
    { key: 'lat', name: 'Los Angeles Times', code: 'lat' },
    { key: 'usa', name: 'USA Today', code: 'usa' },
    { key: 'club', name: 'Crossword Club', code: 'club' },
  ]

  const handleToggleSync = async (sourceKey: string, enabled: boolean) => {
    setSyncSources((prev) => ({ ...prev, [sourceKey]: enabled }))

    if (enabled) {
      try {
        const source = sources.find((s) => s.key === sourceKey)
        if (source) {
          const puzzleData = await syncPuzzle({ source: source.code })
          await loadPuzzleFile(puzzleData)
          // Puzzle saved to archives (AsyncStorage)
        }
      } catch (error) {
        console.error('Failed to sync puzzle:', error)
        // Revert toggle on error
        setSyncSources((prev) => ({ ...prev, [sourceKey]: false }))
      }
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        justifyContent: 'center',
        gap: 24,
        padding: 24,
      }}
    >
      <View style={styles.importBox}>
        <View style={styles.iconBox}>
          <Ionicons size={32} color="#99a1af" name="folder-open" />
        </View>
        <Text style={styles.heading}>Open a .puz file</Text>
        <Text style={styles.paragraph}>
          Tap to pick a puzzle from your Files app, or share one directly from
          your browser
        </Text>
        <TouchableOpacity
          style={styles.importButton}
          onPress={handleLoadPuzzle}
        >
          <Text style={styles.importButtonText}> Browse Files</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.syncBox}>

        <Text style={styles.heading}>Sync Puzzles</Text>
        <Text style={styles.paragraph}>
          Toggle on sources to automatically download and archive the latest
          puzzles.
        </Text>
        {sources.map((source) => (
          <View key={source.key} style={styles.sourceItem}>
            <Text style={styles.sourceName}>{source.name}</Text>
            <Switch
              value={syncSources[source.key as keyof typeof syncSources]}
              onValueChange={(value) => handleToggleSync(source.key, value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={
                syncSources[source.key as keyof typeof syncSources]
                  ? '#f5dd4b'
                  : '#f4f3f4'
              }
            />
          </View>
        ))}
      </View>
      <View style={styles.infoBox}>
        <Text style={{ fontSize: 18, fontWeight: 700 }}>
          How to get puzzle files
        </Text>
        <View style={styles.listItem}>
          <FontAwesome6 color="grey" size={16} padding={4} name="1" />
          <View style={{ gap: 4 }}>
            <Text style={styles.listHeader}>Find a puzzle online</Text>
            <Text style={styles.listText}>
              Visit any crossword site that offers downloadable puzzles —
              hundreds of free archives exist.
            </Text>
            <View style={styles.linkPills}>
              <TouchableOpacity
                onPress={() =>
                  openBrowserAsync('https://crosswordfiend.com/download/')
                }
                style={[styles.linkPill]}
              >
                <Text style={styles.linkText}>{'crosswordfiend.com'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => openBrowserAsync('https://crosshare.org/')}
                style={[styles.linkPill]}
              >
                <Text style={styles.linkText}>{'crosshare.org'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={styles.listItem}>
          <FontAwesome6 color="grey" size={16} padding={4} name="2" />
          <View style={{ gap: 4 }}>
            <Text style={styles.listHeader}>Download the .puz file</Text>
            <Text style={styles.listText}>
              Tap the download link — your browser will save it to Files or
              prompt you to open in an app.
            </Text>
          </View>
        </View>
        <View style={styles.listItem}>
          <FontAwesome6 color="grey" size={16} padding={4} name="3" />
          <View style={{ gap: 4 }}>
            <Text style={styles.listHeader}>Open with Crosses</Text>
            <Text style={styles.listText}>
              Choose {'"Open in Crosses"'} from the share sheet, or use the
              Browse Files button above.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  iconBox: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderColor: '#99a1af',
  },
  linkPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  linkPill: {
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  linkText: {
    fontSize: 10,
  },
  importButton: {
    backgroundColor: '#e87756',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  listItem: {
    flexDirection: 'row',
    gap: 16,
  },
  listHeader: {
    fontSize: 16,
    fontWeight: 700,
    color: '#0a0a0a',
  },
  listText: {
    fontSize: 14,
    fontWeight: 400,
    color: '#4a5565',
  },
  importButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 500,
    textAlign: 'center',
  },
  heading: {
    color: '#0a0a0a',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: 700,
  },
  paragraph: {
    textAlign: 'center',
    fontWeight: 400,
    fontSize: 14,
    color: '#4A5565',
  },
  importBox: {
    backgroundColor: '#fdf2f8',
    borderColor: '#fccee8',
    borderWidth: 2,
    justifyContent: 'center',
    padding: 34,
    gap: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  infoBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
    borderRadius: 24,
    backgroundColor: '#fff',
  },
  syncBox: {
    backgroundColor: '#fdf2f8',
    borderColor: '#fccee8',
    borderWidth: 2,
    justifyContent: 'center',
    padding: 34,
    gap: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  sourceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 8,
  },
  sourceName: {
    fontSize: 16,
    fontWeight: 500,
    color: '#0a0a0a',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f3ef',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: '8',
    width: '100%',
  },
})
