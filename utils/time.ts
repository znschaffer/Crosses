export function formatElapsedTime(startedAt?: string): string {
  if (!startedAt) return '0:00'

  const start = new Date(startedAt).getTime()
  const diffMs = Date.now() - start
  const totalSeconds = Math.floor(diffMs / 1000)

  const days = Math.floor(totalSeconds / (24 * 60 * 60))
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60))
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)
  const seconds = totalSeconds % 60

  if (days > 0) {
    return `${days}d ${hours}h`
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
