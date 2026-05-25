import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { query } from '../config/database.js'

const router = express.Router()

// Monetization-optimized posting windows per platform
// Based on peak engagement windows for creator monetization
export const OPTIMAL_TIMES = {
  instagram: [
    { day: 'Tuesday',   time: '11:00', reason: 'Peak lunch scroll — highest saves/shares' },
    { day: 'Wednesday', time: '10:00', reason: 'Mid-week discovery traffic spike' },
    { day: 'Friday',    time: '10:00', reason: 'Weekend content pre-loading' },
    { day: 'Saturday',  time: '09:00', reason: 'Morning leisure browse — highest Reels plays' },
    { day: 'Sunday',    time: '17:00', reason: 'Pre-week planning — Saves peak for how-to content' },
  ],
  tiktok: [
    { day: 'Tuesday',   time: '09:00', reason: 'Pre-work FYP refresh' },
    { day: 'Thursday',  time: '12:00', reason: 'Lunch FYP — highest comment engagement' },
    { day: 'Friday',    time: '15:00', reason: 'End-of-week viral window' },
    { day: 'Saturday',  time: '11:00', reason: 'Weekend peak — highest share velocity' },
    { day: 'Sunday',    time: '19:00', reason: 'Evening wind-down — highest completion rate' },
  ],
  youtube: [
    { day: 'Thursday', time: '14:00', reason: 'Algorithm push window for weekend recommendations' },
    { day: 'Friday',   time: '12:00', reason: 'TGIF discovery — highest CTR' },
    { day: 'Saturday', time: '11:00', reason: 'Peak weekend viewing — 2× avg watch time' },
  ],
  linkedin: [
    { day: 'Tuesday',    time: '08:00', reason: 'Pre-meeting professional scroll' },
    { day: 'Wednesday',  time: '09:00', reason: 'Mid-week thought leadership peak' },
    { day: 'Thursday',   time: '10:00', reason: 'Decision-maker active window' },
  ],
  twitter: [
    { day: 'Monday',    time: '08:00', reason: 'Week-start hot takes get most RTs' },
    { day: 'Wednesday', time: '09:00', reason: 'Mid-week trending thread window' },
    { day: 'Friday',    time: '09:00', reason: 'End-of-week viral potential' },
  ],
}

// Monetization tier requirements for creator programs
export const MONETIZATION_GATES = {
  instagram: {
    name: 'Instagram Subscriptions + Gifts',
    requirements: [
      { metric: 'followers', threshold: 10000, label: '10K followers for paid partnerships baseline' },
      { metric: 'followers', threshold: 50000, label: '50K followers for Collabs monetization' },
      { metric: 'posts', threshold: 12, label: '12+ posts in last 30 days for Reels bonuses' },
    ],
    tips: [
      'Post 5–7 Reels/week to qualify for Reels Play bonuses',
      'Enable Instagram Subscriptions at 10K followers ($0.99–$99.99/mo)',
      'Add product tags to all content once you hit 1K followers',
    ],
  },
  tiktok: {
    name: 'TikTok Creator Fund + LIVE Gifts',
    requirements: [
      { metric: 'followers', threshold: 1000,  label: '1K followers to go LIVE (gift income)' },
      { metric: 'followers', threshold: 10000, label: '10K followers for Creator Fund' },
    ],
    tips: [
      'Go LIVE 3×/week minimum — gifts convert 10–30% of viewers',
      'Series format boosts follow rate 3× vs standalone videos',
      'Pin a product/affiliate link in bio from day 1',
    ],
  },
  youtube: {
    name: 'YouTube Partner Program',
    requirements: [
      { metric: 'subscribers', threshold: 500,  label: '500 subs for Channel Memberships' },
      { metric: 'subscribers', threshold: 1000, label: '1K subs + 4K watch hours for YPP ads' },
    ],
    tips: [
      'Upload 2–3×/week for the first 90 days (algorithm learning phase)',
      'Shorts + long-form hybrid strategy doubles subscriber growth rate',
      'Enable Super Thanks once in YPP — avg $3–$8 per loyal viewer',
    ],
  },
}

// ── GET /api/schedule ──────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM zyana.scheduled_posts WHERE user_id = $1 ORDER BY scheduled_at ASC`,
      [req.user.id]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/schedule ─────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      platform, content_type, caption, hashtags,
      scheduled_at, status, notes, script_id
    } = req.body

    if (!platform || !scheduled_at) {
      return res.status(400).json({ error: 'platform and scheduled_at are required' })
    }

    const result = await query(`
      INSERT INTO zyana.scheduled_posts
        (user_id, platform, content_type, caption, hashtags, scheduled_at, status, notes, script_id, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
      RETURNING *
    `, [
      req.user.id, platform, content_type || 'post',
      caption || '', hashtags || [],
      scheduled_at, status || 'planned', notes || '', script_id || null
    ])

    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── PUT /api/schedule/:id ──────────────────────────────────
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { platform, content_type, caption, hashtags, scheduled_at, status, notes } = req.body
    const result = await query(`
      UPDATE zyana.scheduled_posts SET
        platform = COALESCE($1, platform),
        content_type = COALESCE($2, content_type),
        caption = COALESCE($3, caption),
        hashtags = COALESCE($4, hashtags),
        scheduled_at = COALESCE($5, scheduled_at),
        status = COALESCE($6, status),
        notes = COALESCE($7, notes),
        updated_at = NOW()
      WHERE id = $8 AND user_id = $9
      RETURNING *
    `, [platform, content_type, caption, hashtags, scheduled_at, status, notes, req.params.id, req.user.id])

    if (!result.rows.length) return res.status(404).json({ error: 'Post not found' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── DELETE /api/schedule/:id ───────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  await query(
    'DELETE FROM zyana.scheduled_posts WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  )
  res.json({ message: 'Deleted' })
})

// ── GET /api/schedule/optimal-times ───────────────────────
// Returns monetization-optimized posting windows
router.get('/optimal-times', authenticate, (req, res) => {
  res.json({ times: OPTIMAL_TIMES, monetization: MONETIZATION_GATES })
})

// ── GET /api/schedule/generate ────────────────────────────
// Auto-generate a 4-week content schedule for the user's platforms
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { platforms = ['instagram'], weeks = 4 } = req.body

    const userResult = await query('SELECT niche FROM zyana.users WHERE id = $1', [req.user.id])
    const niche = userResult.rows[0]?.niche || 'content creation'

    const schedule = []
    const startDate = new Date()
    startDate.setDate(startDate.getDate() + 1) // start tomorrow

    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    for (let week = 0; week < weeks; week++) {
      for (const platform of platforms) {
        const windows = OPTIMAL_TIMES[platform] || []
        for (const window of windows) {
          const targetDay = DAYS.indexOf(window.day)
          const current = new Date(startDate)
          current.setDate(startDate.getDate() + week * 7)

          // Advance to the target day of this week
          const dayDiff = (targetDay - current.getDay() + 7) % 7
          current.setDate(current.getDate() + dayDiff)

          const [h, m] = window.time.split(':')
          current.setHours(parseInt(h), parseInt(m), 0, 0)

          schedule.push({
            platform,
            content_type: platform === 'youtube' ? 'video' : platform === 'instagram' && week % 2 === 0 ? 'reel' : 'post',
            scheduled_at: current.toISOString(),
            notes: window.reason,
            status: 'planned',
            caption: `[${niche.toUpperCase()} content — ${window.day} ${window.time}]`,
          })
        }
      }
    }

    // Sort by date
    schedule.sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))

    // Save to DB
    let saved = 0
    for (const item of schedule) {
      await query(`
        INSERT INTO zyana.scheduled_posts
          (user_id, platform, content_type, caption, scheduled_at, status, notes, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
      `, [req.user.id, item.platform, item.content_type, item.caption, item.scheduled_at, item.status, item.notes])
      saved++
    }

    res.json({ generated: saved, schedule: schedule.slice(0, 20) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
