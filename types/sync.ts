export type SyncPuzzleRequest = {
  source?: string
  sources?: string[]
}

export type SyncErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN_ORIGIN'
  | 'INVALID_JSON'
  | 'UNSUPPORTED_SOURCE'
  | 'DOWNLOAD_FAILED'
  | 'INVALID_REQUEST'
  | 'METHOD_NOT_ALLOWED'
  | 'INTERNAL_ERROR'

export type SyncErrorResponse = {
  ok: false
  error: {
    code: SyncErrorCode
    message: string
  }
}
