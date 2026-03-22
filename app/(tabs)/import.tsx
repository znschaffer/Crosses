import { usePuzzle } from '@/contexts/PuzzleContext'
import { extractPuzzleData, pickPuzFile } from '@/utils/puzzleUtils'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import Ionicons from '@expo/vector-icons/Ionicons'
import { router, useNavigation } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

export default function ImportScreen() {
  const { activePuzzle, loadPuzzleFile } = usePuzzle()
  const [showSuccess, setShowSuccess] = useState(false)
  const navigation = useNavigation()

  useEffect(() => {
    if (showSuccess) {
      navigation.setOptions({
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => setShowSuccess(false)}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            style={{
              marginLeft: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Ionicons name="chevron-back" size={24} color="#1976D2" />
            <Text style={{ fontSize: 16, color: '#1976D2', fontWeight: '500' }}>
              Import
            </Text>
          </TouchableOpacity>
        ),
        title: 'Imported!',
      })
    } else {
      navigation.setOptions({
        headerLeft: undefined,
        title: 'Import',
      })
    }
  }, [showSuccess, navigation])

  const handleLoadPuzzle = async () => {
    try {
      const fileData = await pickPuzFile()
      if (!fileData) return
      const puzzle = await extractPuzzleData(fileData.uri, fileData.name)
      await loadPuzzleFile(puzzle.buffer)
      setShowSuccess(true)
    } catch (error) {
      console.error('Error loading puzzle file: ', error)
    }
  }

  if (showSuccess && activePuzzle?.puzzle) {
    const { puzzle } = activePuzzle
    const title = puzzle.meta?.title ?? 'Untitled'
    const author = puzzle.meta?.author ?? ''
    const acrossClues = Array.isArray(puzzle.clues?.across)
      ? puzzle.clues.across
      : []
    const downClues = Array.isArray(puzzle.clues?.down) ? puzzle.clues.down : []
    const clueCount = acrossClues.length + downClues.length

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.infoBox}>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={styles.puzzleTitle}>{title}</Text>
            {!!author && <Text style={styles.puzzleAuthor}>{author}</Text>}
          </View>

          <View style={styles.puzzleStats}>
            <View style={styles.puzzleStat}>
              <Text style={styles.puzzleStatValue}>{clueCount}</Text>
              <Text style={styles.puzzleStatText}>CLUES</Text>
            </View>
            <View style={styles.puzzleStat}>
              <Text style={styles.puzzleStatValue}>
                ~{Math.floor(clueCount * 0.2)}
              </Text>
              <Text style={styles.puzzleStatText}>MIN EST.</Text>
            </View>
          </View>

          <View style={styles.puzzleClues}>
            <Text style={{ fontSize: 12, fontWeight: '700' }}>A Few Clues</Text>
            {acrossClues.slice(0, 6).map((clue) => (
              <View style={styles.puzzleClue} key={clue.number}>
                <Text style={styles.puzzleClueNumber}>{clue.number}</Text>
                <Text style={styles.puzzleClueText}>{clue.body}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.startPuzzleButton}
          onPress={() => {
            setShowSuccess(false)
            router.navigate('/(tabs)/grid')
          }}
        >
          <Ionicons color="#fff" name="play" />
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '500' }}>
            Start Puzzle
          </Text>
        </TouchableOpacity>
      </ScrollView>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
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
          <Text style={styles.importButtonText}>Browse Files</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBoxWhite}>
        <Text style={styles.infoHeading}>How to get puzzle files</Text>

        <View style={styles.listItem}>
          <FontAwesome6 color="grey" size={16} name="1" />
          <View style={{ gap: 4 }}>
            <Text style={styles.listHeader}>Find a puzzle online</Text>
            <Text style={styles.listText}>
              Visit any crossword site that offers downloadable puzzles —
              hundreds of free archives exist.
            </Text>
          </View>
        </View>

        <View style={styles.listItem}>
          <FontAwesome6 color="grey" size={16} name="2" />
          <View style={{ gap: 4 }}>
            <Text style={styles.listHeader}>Download the .puz file</Text>
            <Text style={styles.listText}>
              Tap the download link — your browser will save it to Files or
              prompt you to open in an app.
            </Text>
          </View>
        </View>

        <View style={styles.listItem}>
          <FontAwesome6 color="grey" size={16} name="3" />
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
  container: { flex: 1, backgroundColor: '#f5f3ef' },
  contentContainer: { justifyContent: 'center', gap: 24, padding: 24 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 16, color: '#1976D2', fontWeight: '500' },
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
  iconBox: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderColor: '#99a1af',
  },
  heading: {
    color: '#0a0a0a',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
  },
  paragraph: {
    textAlign: 'center',
    fontWeight: '400',
    fontSize: 14,
    color: '#4A5565',
  },
  importButton: {
    backgroundColor: '#e87756',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  importButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  infoBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
  },
  infoBoxWhite: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
    borderRadius: 24,
    backgroundColor: '#fff',
  },
  infoHeading: { fontSize: 18, fontWeight: '700' },
  listItem: { flexDirection: 'row', gap: 16, alignSelf: 'stretch' },
  listHeader: { fontSize: 16, fontWeight: '700', color: '#0a0a0a' },
  listText: { fontSize: 14, fontWeight: '400', color: '#4a5565' },
  puzzleTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0a0a0a',
    textAlign: 'center',
  },
  puzzleAuthor: { fontSize: 14, fontWeight: '400', color: '#4a5565' },
  puzzleStats: { flexDirection: 'row', gap: 24 },
  puzzleStat: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  puzzleStatValue: { fontWeight: '700', fontSize: 30, textAlign: 'center' },
  puzzleStatText: { fontSize: 12, color: '#4a5565', textAlign: 'center' },
  puzzleClues: {
    alignSelf: 'stretch',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    backgroundColor: '#f9fafb',
  },
  puzzleClue: { flexDirection: 'row', gap: 14 },
  puzzleClueNumber: {
    color: '#e87756',
    width: 24,
    fontSize: 14,
    fontWeight: '700',
  },
  puzzleClueText: { fontSize: 14, color: '#101828', flex: 1 },
  startPuzzleButton: {
    backgroundColor: '#e87756',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
})
