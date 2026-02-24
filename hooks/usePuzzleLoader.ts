import { usePuzzle } from '@/contexts/PuzzleContext'
import { extractPuzzleData, pickPuzFile } from '@/utils/puzzleUtils'

export function usePuzzleLoader() {
  const { setPuzzle } = usePuzzle()
  const handleLoadPuzzle = async () => {
    try {
      const fileData = await pickPuzFile()
      if (!fileData) return
      const puzzle = await extractPuzzleData(fileData.uri, fileData.name)
      setPuzzle(puzzle)
      console.log('Puzzle loaded successfully:', puzzle.title)
    } catch (error) {
      console.error('Error loading puzzle file: ', error)
    }
  }

  return { handleLoadPuzzle }
}
