import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { query } from '../config/database.js'

const router = express.Router()
const HEYGEN_BASE = 'https://api.heygen.com'

function heygenHeaders() {
  return {
    'X-Api-Key': process.env.HEYGEN_API_KEY || '',
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

// GET /api/studio/avatars — list available HeyGen avatars
router.get('/avatars', authenticate, async (req, res) => {
  try {
    if (!process.env.HEYGEN_API_KEY) return res.json({ avatars: [], configured: false })

    const r = await fetch(`${HEYGEN_BASE}/v2/avatars`, { headers: heygenHeaders() })
    const data = await r.json()
    res.json({ avatars: data.data?.avatars || [], configured: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/studio/voices — list available HeyGen voices
router.get('/voices', authenticate, async (req, res) => {
  try {
    if (!process.env.HEYGEN_API_KEY) return res.json({ voices: [], configured: false })

    const r = await fetch(`${HEYGEN_BASE}/v2/voices`, { headers: heygenHeaders() })
    const data = await r.json()
    res.json({ voices: data.data?.voices || [], configured: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/studio/generate — create a HeyGen avatar video from a script
router.post('/generate', authenticate, async (req, res) => {
  try {
    if (!process.env.HEYGEN_API_KEY) {
      return res.status(503).json({
        error: 'HeyGen API not configured. Add HEYGEN_API_KEY to your environment variables.',
        docs: 'https://docs.heygen.com/reference/create-an-avatar-video-v2'
      })
    }

    const {
      script,
      avatarId,
      voiceId,
      aspectRatio = '9:16',
      testMode = true,        // testMode=true → watermarked, no credits used
      backgroundType = 'color',
      backgroundValue = '#F7F5F0',
    } = req.body

    if (!script || script.trim().length < 10) {
      return res.status(400).json({ error: 'Script must be at least 10 characters' })
    }

    const payload = {
      test: testMode,
      aspect_ratio: aspectRatio,
      caption: false,
      video_inputs: [{
        character: {
          type: 'avatar',
          avatar_id: avatarId || 'Tyler-incasual-20220721',
          avatar_style: 'normal',
        },
        voice: {
          type: 'text',
          input_text: script.trim(),
          voice_id: voiceId || '2d5b0e6cf36f460aa7fc47e3eee4ba54',
          speed: 1.0,
        },
        background: {
          type: backgroundType,
          value: backgroundValue,
        },
      }],
    }

    const r = await fetch(`${HEYGEN_BASE}/v2/video/generate`, {
      method: 'POST',
      headers: heygenHeaders(),
      body: JSON.stringify(payload),
    })
    const data = await r.json()

    if (data.error) {
      return res.status(400).json({ error: data.error.message || 'HeyGen API error', code: data.error.code })
    }

    const videoId = data.data?.video_id
    if (!videoId) return res.status(500).json({ error: 'No video_id returned from HeyGen' })

    // Persist to DB
    await query(`
      INSERT INTO zyana.studio_videos (user_id, video_id, script_preview, avatar_id, status, metadata)
      VALUES ($1, $2, $3, $4, 'processing', $5)
    `, [req.user.id, videoId, script.slice(0, 300), avatarId || 'default',
        JSON.stringify({ aspectRatio, testMode, voiceId: voiceId || 'default' })])

    console.log(`🎬 Studio: video ${videoId} queued for user ${req.user.id}`)
    res.json({ videoId, status: 'processing' })
  } catch (error) {
    console.error('Studio generate error:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/studio/video/:id — poll video status from HeyGen
router.get('/video/:id', authenticate, async (req, res) => {
  try {
    if (!process.env.HEYGEN_API_KEY) return res.status(503).json({ error: 'Not configured' })

    const r = await fetch(`${HEYGEN_BASE}/v1/video_status.get?video_id=${req.params.id}`, {
      headers: heygenHeaders(),
    })
    const data = await r.json()
    const { status, video_url, thumbnail_url } = data.data || {}

    // Update our DB
    if (status) {
      await query(`
        UPDATE zyana.studio_videos
        SET status=$1, video_url=$2, thumbnail_url=$3, updated_at=NOW()
        WHERE video_id=$4 AND user_id=$5
      `, [status, video_url || null, thumbnail_url || null, req.params.id, req.user.id])
    }

    res.json({ status, videoUrl: video_url, thumbnailUrl: thumbnail_url })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/studio/videos — list user's generated videos
router.get('/videos', authenticate, async (req, res) => {
  const result = await query(`
    SELECT id, video_id, script_preview, avatar_id, status, video_url, thumbnail_url, metadata, created_at
    FROM zyana.studio_videos WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20
  `, [req.user.id])
  res.json(result.rows)
})

export default router
