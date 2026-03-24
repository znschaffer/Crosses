import type {
  SyncErrorCode,
  SyncErrorResponse,
  SyncPuzzleRequest,
} from '../types/sync'

const SYNC_API_BASE_URL = process.env.EXPO_PUBLIC_SYNC_API_BASE_URL
const SYNC_API_KEY = process.env.EXPO_PUBLIC_SYNC_API_KEY

function getSyncEndpoint() {
  if (!SYNC_API_BASE_URL) {
    throw new Error('Missing EXPO_PUBLIC_SYNC_API_BASE_URL')
  }

  return `${SYNC_API_BASE_URL.replace(/\/$/, '')}/api/puzzles/sync`
}

function isSyncErrorResponse(payload: unknown): payload is SyncErrorResponse {
  if (!payload || typeof payload !== 'object') {
    return false
  }

  const candidate = payload as SyncErrorResponse
  return (
    candidate.ok === false &&
    !!candidate.error &&
    typeof candidate.error.code === 'string' &&
    typeof candidate.error.message === 'string'
  )
}

function mapErrorCodeToMessage(code: SyncErrorCode) {
  switch (code) {
    case 'UNAUTHORIZED':
      return 'Sync API key is missing or invalid'
    case 'FORBIDDEN_ORIGIN':
      return 'This app origin is not allowed to access the sync service'
    case 'INVALID_JSON':
    case 'INVALID_REQUEST':
      return 'Sync request is invalid'
    case 'UNSUPPORTED_SOURCE':
      return 'This puzzle source is not supported'
    case 'DOWNLOAD_FAILED':
      return 'Failed to download puzzle from the selected source'
    case 'METHOD_NOT_ALLOWED':
      return 'Sync endpoint method is not allowed'
    case 'INTERNAL_ERROR':
      return 'Sync service failed unexpectedly'
    default:
      return 'Sync failed'
  }
}

export async function syncPuzzle(
  params: SyncPuzzleRequest
): Promise<ArrayBuffer> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (SYNC_API_KEY) {
    headers['X-API-Key'] = SYNC_API_KEY
  }

  const response = await fetch(getSyncEndpoint(), {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  })

  const contentType = response.headers.get('content-type') || ''

  if (!response.ok) {
    let errorMessage = 'Sync failed'

    try {
      const payload: unknown = await response.json()
      if (isSyncErrorResponse(payload)) {
        errorMessage =
          payload.error.message || mapErrorCodeToMessage(payload.error.code)
      }
    } catch {
      // Ignore invalid error payloads and fall back to a generic message.
    }

    throw new Error(errorMessage)
  }

  if (!contentType.includes('application/octet-stream')) {
    throw new Error('Unexpected response type from sync service')
  }

  return response.arrayBuffer()
}
