import cors from 'cors'
import express from 'express'

const PORT = Number(process.env.TNY_PROXY_PORT || 8787)

const ALLOWLIST = [
  'https://www.newyorker.com/puzzles-and-games-dept/crossword',
  'https://www.newyorker.com/puzzles-and-games-dept/mini-crossword',
  'https://puzzles-games-api.gp-prod.conde.digital/api/v1/games/',
]

const app = express()
app.use(cors())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/proxy', async (req, res) => {
  const target = String(req.query.url || '')

  if (!target) {
    return res.status(400).json({ ok: false, error: 'Missing url query param' })
  }

  if (!ALLOWLIST.some((prefix) => target.startsWith(prefix))) {
    return res.status(400).json({ ok: false, error: 'URL not allowed' })
  }

  try {
    const upstream = await fetch(target)
    const bytes = await upstream.arrayBuffer()

    res.status(upstream.status)
    const contentType = upstream.headers.get('content-type')
    if (contentType) {
      res.setHeader('content-type', contentType)
    }

    return res.send(Buffer.from(bytes))
  } catch (error) {
    console.error('[tny-proxy] Upstream request failed:', error)
    return res.status(502).json({ ok: false, error: 'Proxy fetch failed' })
  }
})

app.listen(PORT, () => {
  console.log(`[tny-proxy] Listening at http://localhost:${PORT}`)
})
