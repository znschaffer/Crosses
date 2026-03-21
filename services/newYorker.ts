import { puzEncode, xdToJSON } from 'xd-crossword-tools'
import type { Clue, CrosswordJSON, Tile } from 'xd-crossword-tools'

const NEW_YORKER_CROSSWORD_URL =
  'https://www.newyorker.com/puzzles-and-games-dept/crossword'
const NEW_YORKER_MINI_URL =
  'https://www.newyorker.com/puzzles-and-games-dept/mini-crossword'
const NEW_YORKER_API_BASE_URL =
  'https://puzzles-games-api.gp-prod.conde.digital/api/v1/games/'

type NewYorkerVariant = 'crossword' | 'mini'

export type NewYorkerDownloadOptions = {
  date?: Date | string
  variant?: NewYorkerVariant
  proxyBaseUrl?: string
}

type NewYorkerPuzzleMetadata = {
  date?: string
  themeTitle?: string
}

type PuzPayload = {
  grid: string[][]
  meta: Record<string, string>
  circles: number[]
  shades: number[]
  clues: {
    across: string[]
    down: string[]
  }
}

function getVariantConfig(variant: NewYorkerVariant) {
  if (variant === 'mini') {
    return {
      latestUrl: NEW_YORKER_MINI_URL,
      urlPathNeedle: '/mini-crossword/',
      titlePrefix: 'The Mini Crossword',
    }
  }

  return {
    latestUrl: NEW_YORKER_CROSSWORD_URL,
    urlPathNeedle: '/crossword/',
    titlePrefix: 'The Crossword',
  }
}

function buildProxyUrl(targetUrl: string, proxyBaseUrl?: string) {
  if (!proxyBaseUrl) {
    return targetUrl
  }

  const normalizedBase = proxyBaseUrl.replace(/\/$/, '')
  return `${normalizedBase}/proxy?url=${encodeURIComponent(targetUrl)}`
}

async function fetchText(url: string, proxyBaseUrl?: string) {
  const response = await fetch(buildProxyUrl(url, proxyBaseUrl))

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`)
  }

  return response.text()
}

async function fetchJson<T>(url: string, proxyBaseUrl?: string) {
  const response = await fetch(buildProxyUrl(url, proxyBaseUrl))

  if (response.status === 403) {
    throw new Error('New Yorker puzzle API rejected the request')
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch puzzle data from ${url}`)
  }

  return (await response.json()) as T
}

function extractLatestPuzzleUrl(html: string, urlPathNeedle: string) {
  const scriptPattern =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi

  for (const match of html.matchAll(scriptPattern)) {
    const jsonBlock = match[1]?.trim()
    if (!jsonBlock) {
      continue
    }

    try {
      const parsed = JSON.parse(jsonBlock) as {
        itemListElement?: Array<{ url?: string }>
      }
      const latestUrl = parsed.itemListElement?.find((item) =>
        item.url?.includes(urlPathNeedle)
      )?.url

      if (latestUrl) {
        return latestUrl
      }
    } catch {
      continue
    }
  }

  throw new Error('Could not identify the latest New Yorker puzzle URL')
}

function padDateSegment(value: number) {
  return String(value).padStart(2, '0')
}

function resolvePuzzleUrlFromDate(date: Date, variant: NewYorkerVariant) {
  const baseUrl =
    variant === 'mini' ? NEW_YORKER_MINI_URL : NEW_YORKER_CROSSWORD_URL

  const year = date.getFullYear()
  const month = padDateSegment(date.getMonth() + 1)
  const day = padDateSegment(date.getDate())

  return `${baseUrl}/${year}/${month}/${day}`
}

function normalizeDateInput(date: NewYorkerDownloadOptions['date']) {
  if (!date) {
    return null
  }

  if (date instanceof Date) {
    if (Number.isNaN(date.getTime())) {
      throw new Error('Invalid date passed to downloadNewYorkerPuzzle')
    }

    return date
  }

  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid date passed to downloadNewYorkerPuzzle')
  }

  return parsed
}

function extractPuzzleId(html: string) {
  const match = html.match(
    /"id":"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"/i
  )

  if (!match?.[1]) {
    throw new Error('Could not find the New Yorker puzzle ID')
  }

  return match[1]
}

function decodeHtmlAttribute(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function extractPuzzleMetadata(html: string): NewYorkerPuzzleMetadata {
  const metadata: NewYorkerPuzzleMetadata = {}
  const descriptionMatch = html.match(
    /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i
  )
  const datetimeMatch = html.match(/<time[^>]*datetime=["']([^"']+)["'][^>]*>/i)

  const description = descriptionMatch?.[1]
    ? decodeHtmlAttribute(descriptionMatch[1])
    : null

  if (description?.startsWith('Today’s theme: ')) {
    metadata.themeTitle = description
      .slice('Today’s theme: '.length)
      .replace(/\.$/, '')
  }

  if (datetimeMatch?.[1]) {
    metadata.date = datetimeMatch[1]
  }

  return metadata
}

function stringifyClue(clue: Clue) {
  return clue.metadata?.hint
    ? `${clue.body} // ${clue.metadata.hint}`
    : clue.body
}

function tileToSolution(tile: Tile) {
  switch (tile.type) {
    case 'blank':
      return '.'
    case 'letter':
      return tile.letter.toUpperCase()
    case 'rebus':
      return tile.word.toUpperCase()
    case 'schrodinger':
      if (tile.validRebuses[0]?.letters) {
        return tile.validRebuses[0].letters.toUpperCase()
      }
      if (tile.validLetters[0]) {
        return tile.validLetters[0].toUpperCase()
      }
      throw new Error('Unsupported Schrödinger tile in New Yorker puzzle')
    default:
      throw new Error('Unsupported tile type in New Yorker puzzle')
  }
}

function getMarkupIndexes(crossword: CrosswordJSON) {
  const circles: number[] = []
  const shades: number[] = []

  if (!crossword.design) {
    return { circles, shades }
  }

  crossword.design.positions.forEach((row, rowIndex) => {
    row.forEach((styleKey, columnIndex) => {
      if (!styleKey) {
        return
      }

      const style = crossword.design?.styles[styleKey]
      if (!style) {
        return
      }

      const tileIndex = rowIndex * row.length + columnIndex

      if (style.background === 'circle') {
        circles.push(tileIndex)
      } else if (style.background) {
        shades.push(tileIndex)
      }
    })
  })

  return { circles, shades }
}

function toPuzPayload(crossword: CrosswordJSON): PuzPayload {
  const across: string[] = []
  const down: string[] = []

  crossword.clues.across.forEach((clue) => {
    across[clue.number] = stringifyClue(clue)
  })

  crossword.clues.down.forEach((clue) => {
    down[clue.number] = stringifyClue(clue)
  })

  const { circles, shades } = getMarkupIndexes(crossword)

  return {
    grid: crossword.tiles.map((row) => row.map(tileToSolution)),
    meta: {
      title: crossword.meta.title ?? '',
      author: crossword.meta.author ?? '',
      copyright: crossword.meta.copyright ?? '',
      description: crossword.notes ?? '',
    },
    circles,
    shades,
    clues: {
      across,
      down,
    },
  }
}

function trimTitle(title: string) {
  return title.includes('<') ? title.split('<')[0].trim() : title.trim()
}

function applyNewYorkerMetadata(
  crossword: CrosswordJSON,
  metadata: NewYorkerPuzzleMetadata,
  titlePrefix: string
) {
  crossword.meta.title = trimTitle(crossword.meta.title ?? '')

  if (metadata.themeTitle) {
    crossword.meta.title = `${crossword.meta.title} - ${metadata.themeTitle}`
  }

  if (metadata.date) {
    crossword.meta.date = metadata.date
  }

  if (!crossword.meta.title) {
    crossword.meta.title = titlePrefix
  }
}

type NewYorkerApiResponse = {
  data?: string
}

async function getPuzzlePageUrl(options: NewYorkerDownloadOptions) {
  const variant = options.variant ?? 'crossword'
  const parsedDate = normalizeDateInput(options.date)

  if (parsedDate) {
    return resolvePuzzleUrlFromDate(parsedDate, variant)
  }

  const { latestUrl, urlPathNeedle } = getVariantConfig(variant)
  const html = await fetchText(latestUrl, options.proxyBaseUrl)
  return extractLatestPuzzleUrl(html, urlPathNeedle)
}

export async function downloadNewYorkerPuzzle(
  options: NewYorkerDownloadOptions = {}
) {
  const variant = options.variant ?? 'crossword'
  console.log('[NewYorker] Starting download', {
    variant,
    date: options.date ?? 'latest',
    proxy: options.proxyBaseUrl ?? 'none',
  })
  const puzzlePageUrl = await getPuzzlePageUrl(options)
  console.log('[NewYorker] Resolved puzzle page URL', puzzlePageUrl)
  const puzzlePageHtml = await fetchText(puzzlePageUrl, options.proxyBaseUrl)
  const puzzleId = extractPuzzleId(puzzlePageHtml)
  const metadata = extractPuzzleMetadata(puzzlePageHtml)
  console.log('[NewYorker] Extracted puzzle metadata', {
    puzzleId,
    date: metadata.date ?? null,
    themeTitle: metadata.themeTitle ?? null,
  })
  const apiResponse = await fetchJson<NewYorkerApiResponse>(
    `${NEW_YORKER_API_BASE_URL}${puzzleId}`,
    options.proxyBaseUrl
  )

  if (!apiResponse.data) {
    throw new Error('New Yorker puzzle payload was empty')
  }

  const crossword = xdToJSON(apiResponse.data)
  applyNewYorkerMetadata(
    crossword,
    metadata,
    getVariantConfig(variant).titlePrefix
  )

  const puzBytes = puzEncode(toPuzPayload(crossword))
  console.log('[NewYorker] Encoded .puz bytes', puzBytes.byteLength)
  return puzBytes.buffer.slice(
    puzBytes.byteOffset,
    puzBytes.byteOffset + puzBytes.byteLength
  )
}

export function downloadLatestNewYorkerPuzzle(
  options: Omit<NewYorkerDownloadOptions, 'date'> = {}
) {
  return downloadNewYorkerPuzzle(options)
}
