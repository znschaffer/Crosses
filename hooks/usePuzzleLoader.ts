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
      loadPuzzleFile(puzzle)
      console.log('cells with numbers:')
      puzzle.grid.cells
        .flat()
        .filter((c) => c.number != null)
        .slice(0, 8)
        .forEach((c) =>
          console.log(
            '  cell:',
            c.number,
            'isBlack:',
            c.isBlack,
            'solution:',
            c.solution
          )
        )

      console.log('across clues:', puzzle.clues.across.slice(0, 5))
      console.log('down clues:', puzzle.clues.down.slice(0, 5))
      console.log('Puzzle loaded successfully:', puzzle.title)
      router.push('/(tabs)/import/importSuccess')
    } catch (error) {
      console.error('Error loading puzzle file: ', error)
    }
  }

  return { handleLoadPuzzle }
}
