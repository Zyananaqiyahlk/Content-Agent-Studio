import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { query } from '../config/database.js'

const router = express.Router()

const PLATFORMS = ['instagram', 'tiktok', 'youtube', 'linkedin', 'twitter']

// YouTube Data API — fetch channel stats by handle
async function fetchYouTubeMetrics(handle) {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return null

  const cleanHandle = handle.replace(/^@/, '')
  const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&forHandle=${encodeURIComponent(cleanHandle)}&key=${apiKey}`

  try {
    const res = await fetch(url)
    const data = await res.json()

    if (!data.items?.length) {
      // Fallback: try by channel name search
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(cleanHandle)}&maxResults=1&key=${apiKey}`
      const searchRes = await fetch(searchUrl)
      const searchData = await searchRes.json()
      if (!searchData.items?.length) return null

      const channelId = searchData.items[0].id.channelId
      const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${apiKey}`
      const channelRes = await fetch(channelUrl)
      const channelData = await channelRes.json()
      if (!channelData.items?.length) return null

      const ch = channelData.items[0]
      return buildYouTubeMetrics(ch)
    }

    return buildYouTubeMetrics(data.items[0])
  } catch {
    return null
  }
}

function buildYouTubeMetrics(channel) {
  return {
    subscribers: parseInt(channel.statistics.subscriberCount || 0),
    views: parseInt(channel.statistics.viewCount || 0),
    videos: parseInt(channel.statistics.videoCount || 0),
    title: channel.snippet.title,
    description: channel.snippet.description?.slice(0, 200),
    thumbnail: channel.snippet.thumbnails?.default?.url,
    synced_at: new Date().toISOString(),
  }
}

// GET /api/platforms — all platforms for the current user
router.get('/', authenticate, async (req, res) => {
  const result = await query(
    'SELECT platform, handle, metrics, synced_at FROM zyana.user_platforms WHERE user_id = $1',
    [req.user.id]
  )

  // Return all known platforms, even if not saved yet
  const saved = Object.fromEntries(result.rows.map(r => [r.platform, r]))
  const all = PLATFORMS.map(p => saved[p] || { platform: p, handle: '', metrics: {}, synced_at: null })
  res.json(all)
})

// PUT /api/platforms — save handles (batch upsert)
router.put('/', authenticate, async (req, res) => {
  try {
    const { platforms } = req.body
    if (!Array.isArray(platforms)) return res.status(400).json({ error: 'platforms must be an array' })

    for (const { platform, handle } of platforms) {
      if (!PLATFORMS.includes(platform)) continue
      await query(`
        INSERT INTO zyana.user_platforms (user_id, platform, handle, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (user_id, platform) DO UPDATE SET handle = $3, updated_at = NOW()
      `, [req.user.id, platform, (handle || '').trim()])
    }

    res.json({ message: 'Platforms saved' })
  } catch (error) {
    console.error('Platform save error:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/platforms/sync-youtube — refresh YouTube metrics from API
router.post('/sync-youtube', authenticate, async (req, res) => {
  try {
    const result = await query(
      'SELECT handle FROM zyana.user_platforms WHERE user_id = $1 AND platform = $2',
      [req.user.id, 'youtube']
    )

    const handle = result.rows[0]?.handle
    if (!handle) return res.status(400).json({ error: 'No YouTube handle saved — add it in Settings first' })

    if (!process.env.YOUTUBE_API_KEY) {
      return res.status(503).json({ error: 'YouTube API not configured. Add YOUTUBE_API_KEY to your environment.' })
    }

    const metrics = await fetchYouTubeMetrics(handle)
    if (!metrics) return res.status(404).json({ error: 'YouTube channel not found. Check your handle is correct.' })

    await query(`
      UPDATE zyana.user_platforms
      SET metrics = $1, synced_at = NOW(), updated_at = NOW()
      WHERE user_id = $2 AND platform = 'youtube'
    `, [JSON.stringify(metrics), req.user.id])

    console.log(`📊 YouTube sync: user ${req.user.id} — ${metrics.subscribers} subscribers`)
    res.json(metrics)
  } catch (error) {
    console.error('YouTube sync error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
