import { PuzzleState } from '@/types/PuzzleState.t'
function toDateKey(dateString: string) {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function subtractOneDay(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`)
  date.setDate(date.getDate() - 1)

  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function calculateDailyStreak(
  puzzles: Record<string, PuzzleState>
): number {
  const completedDates = Object.values(puzzles)
    .filter((puzzle) => puzzle.complete && puzzle.finishedAt)
    .map((puzzle) => toDateKey(puzzle.finishedAt as string))

  const uniqueDates = [...new Set(completedDates)].sort().reverse()

  if (uniqueDates.length === 0) return 0

  const todayKey = toDateKey(new Date().toISOString())
  const yesterdayKey = subtractOneDay(todayKey)
  // if user didn't complete one today or yesterday, streak is broken
  if (uniqueDates[0] !== todayKey && uniqueDates[0] !== yesterdayKey) {
    return 0
  }

  let streak = 1
  let currentDate = uniqueDates[0]

  for (let i = 1; i < uniqueDates.length; i++) {
    const expectedPreviousDay = subtractOneDay(currentDate)
    if (uniqueDates[i] === expectedPreviousDay) {
      streak++
      currentDate = uniqueDates[i]
    } else {
      break
    }
  }
  return streak
}
