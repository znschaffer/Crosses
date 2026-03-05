import { usePuzzle } from '@/contexts/PuzzleContext'
import { extractPuzzleData, pickPuzFile } from '@/utils/puzzleUtils'
import { router } from 'expo-router'

export function usePuzzleLoader() {
  const { loadPuzzleFile } = usePuzzle()
  const handleLoadPuzzle = async () => {
    try {
      const fileData = await pickPuzFile()
      if (!fileData) return
      const puzzle = await extractPuzzleData(fileData.uri, fileData.name)
      loadPuzzleFile(puzzle.buffer)
      router.push('/(tabs)/import/importSuccess')
    } catch (error) {
      console.error('Error loading puzzle file: ', error)
    }
  }

  return { handleLoadPuzzle }
}
