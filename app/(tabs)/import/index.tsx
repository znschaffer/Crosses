import { TimedAlert, type TimedAlertState } from '@/components/timed-alert'
import { usePuzzle } from '@/contexts/PuzzleContext'
import { usePuzzleLoader } from '@/hooks/usePuzzleLoader'
import {
  DEFAULT_SYNC_SOURCES,
  formatSyncSummary,
  loadSyncSources,
  saveSyncSources,
  syncRecentTnyPuzzles,
  type SyncSources,
} from '@/services/syncSettings'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import Ionicons from '@expo/vector-icons/Ionicons'
import { openBrowserAsync } from 'expo-web-browser'
import { useEffect, useState } from 'react'
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

export default function ImportScreen() {
  const { handleLoadPuzzle } = usePuzzleLoader()
  const { loadPuzzleFile, state } = usePuzzle()
  const [syncSources, setSyncSources] =
    useState<SyncSources>(DEFAULT_SYNC_SOURCES)
  const [syncSourcesLoaded, setSyncSourcesLoaded] = useState(false)
  const [alert, setAlert] = useState<TimedAlertState | null>(null)

  const showAlert = (message: string, tone: TimedAlertState['tone']) => {
    setAlert({ id: Date.now(), message, tone })
  }

  useEffect(() => {
    const hydrateSyncSources = async () => {
      const persisted = await loadSyncSources()
      setSyncSources(persisted)
      setSyncSourcesLoaded(true)
    }

    hydrateSyncSources()
  }, [])

  useEffect(() => {
    if (!syncSourcesLoaded) {
      return
    }

    saveSyncSources(syncSources).catch((error) => {
      console.warn('[Import] Failed to persist sync sources', error)
    })
  }, [syncSources, syncSourcesLoaded])

  const handleToggleSync = async (enabled: boolean) => {
    setSyncSources((prev) => ({ ...prev, tny: enabled }))

    if (enabled) {
      try {
        const result = await syncRecentTnyPuzzles({
          days: 30,
          existingPuzzleIds: new Set(Object.keys(state.puzzles)),
          loadPuzzleFile,
        })
        showAlert(
          formatSyncSummary(result),
          result.failed > 0 ? 'info' : 'success'
        )
      } catch (error) {
        console.error('Failed to sync puzzle:', error)
        showAlert('Sync failed. Please try again.', 'error')
        setSyncSources((prev) => ({ ...prev, tny: false }))
      }
    }
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{
            justifyContent: 'center',
            gap: 24,
            padding: 24,
          }}
        >
          <View style={styles.syncBox}>
            <Text style={styles.heading}>Sync Puzzles</Text>
            <Text style={styles.paragraph}>
              Auto-download and archive new puzzles.
            </Text>
            <View style={styles.sourceItem}>
              <Text style={styles.sourceName}>The New Yorker</Text>
              <Switch
                value={syncSources.tny}
                onValueChange={handleToggleSync}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={syncSources.tny ? '#f5dd4b' : '#f4f3f4'}
              />
            </View>
          </View>
          <View style={styles.importBox}>
            <View style={styles.iconBox}>
              <Ionicons size={32} color="#99a1af" name="folder-open" />
            </View>
            <Text style={styles.heading}>Open a .puz file</Text>
            <Text style={styles.paragraph}>
              Tap to pick a puzzle from your Files app, or share one directly
              from your browser
            </Text>
            <TouchableOpacity
              style={styles.importButton}
              onPress={handleLoadPuzzle}
            >
              <Text style={styles.importButtonText}> Browse Files</Text>
            </TouchableOpacity>
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
      </SafeAreaView>
      <TimedAlert alert={alert} onHide={() => setAlert(null)} />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
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
