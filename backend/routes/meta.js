import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { query } from '../config/database.js'

const router = express.Router()

const META_API = 'https://graph.facebook.com/v19.0'
const REQUIRED_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'instagram_basic',
  'instagram_manage_insights',
].join(',')

function metaAppId()     { return process.env.META_APP_ID }
function metaAppSecret() { return process.env.META_APP_SECRET }
function redirectUri()   { return process.env.META_REDIRECT_URI || `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/meta/callback` }

// ── GET /api/meta/auth-url ─────────────────────────────────
// Returns the Facebook OAuth URL the frontend redirects the user to
router.get('/auth-url', authenticate, (req, res) => {
  const appId = metaAppId()
  if (!appId) return res.status(503).json({ error: 'META_APP_ID not configured' })

  const state = Buffer.from(JSON.stringify({ userId: req.user.id, ts: Date.now() })).toString('base64url')
  const url = new URL('https://www.facebook.com/dialog/oauth')
  url.searchParams.set('client_id', appId)
  url.searchParams.set('redirect_uri', redirectUri())
  url.searchParams.set('scope', REQUIRED_SCOPES)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', state)

  res.json({ url: url.toString() })
})

// ── GET /api/meta/callback ─────────────────────────────────
// Meta redirects here after user authorises — exchanges code for token
// then fetches Instagram business account and saves everything
router.get('/callback', async (req, res) => {
  const { code, state, error: oauthError } = req.query

  const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173'

  if (oauthError) {
    return res.redirect(`${frontendBase}/insights?error=${encodeURIComponent('Meta authorization denied')}`)
  }

  try {
    // Decode state to get userId
    const { userId } = JSON.parse(Buffer.from(state, 'base64url').toString())

    // Exchange code → short-lived token
    const tokenRes = await fetch(
      `${META_API}/oauth/access_token?client_id=${metaAppId()}&redirect_uri=${encodeURIComponent(redirectUri())}&client_secret=${metaAppSecret()}&code=${code}`
    )
    const tokenData = await tokenRes.json()
    if (tokenData.error) throw new Error(tokenData.error.message)
    const shortToken = tokenData.access_token

    // Exchange short-lived → long-lived (60-day) token
    const longRes = await fetch(
      `${META_API}/oauth/access_token?grant_type=fb_exchange_token&client_id=${metaAppId()}&client_secret=${metaAppSecret()}&fb_exchange_token=${shortToken}`
    )
    const longData = await longRes.json()
    const longToken = longData.access_token || shortToken
    const expiresIn = longData.expires_in || 5183944 // ~60 days default

    // Get Facebook pages linked to the user
    const pagesRes = await fetch(`${META_API}/me/accounts?access_token=${longToken}`)
    const pagesData = await pagesRes.json()
    if (!pagesData.data?.length) throw new Error('No Facebook pages found. Make sure you have a Facebook Page with an Instagram Business account linked.')

    // Find the page that has an Instagram business account
    let igUserId = null
    let pageAccessToken = null
    let pageName = null

    for (const page of pagesData.data) {
      const igRes = await fetch(`${META_API}/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`)
      const igData = await igRes.json()
      if (igData.instagram_business_account?.id) {
        igUserId = igData.instagram_business_account.id
        pageAccessToken = page.access_token
        pageName = page.name
        break
      }
    }

    if (!igUserId) throw new Error('No Instagram Business or Creator account found. Make sure your Instagram is connected to your Facebook Page and switched to a Business/Creator account.')

    // Get Instagram profile details
    const profileRes = await fetch(
      `${META_API}/${igUserId}?fields=name,username,followers_count,follows_count,media_count,profile_picture_url,biography,website&access_token=${pageAccessToken}`
    )
    const profile = await profileRes.json()

    // Save to DB
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()
    await query(`
      INSERT INTO zyana.meta_connections
        (user_id, ig_user_id, page_name, access_token, token_expires_at, profile, connected_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        ig_user_id = EXCLUDED.ig_user_id,
        page_name = EXCLUDED.page_name,
        access_token = EXCLUDED.access_token,
        token_expires_at = EXCLUDED.token_expires_at,
        profile = EXCLUDED.profile,
        updated_at = NOW()
    `, [userId, igUserId, pageName, pageAccessToken, expiresAt, JSON.stringify(profile)])

    // Also sync to user_platforms table for dashboard
    await query(`
      INSERT INTO zyana.user_platforms (user_id, platform, handle, metrics, synced_at, updated_at)
      VALUES ($1,'instagram',$2,$3,NOW(),NOW())
      ON CONFLICT (user_id, platform) DO UPDATE SET
        handle = EXCLUDED.handle,
        metrics = EXCLUDED.metrics,
        synced_at = NOW(),
        updated_at = NOW()
    `, [userId, `@${profile.username}`, JSON.stringify({
      followers: profile.followers_count,
      following: profile.follows_count,
      posts: profile.media_count,
      username: profile.username,
      name: profile.name,
    })])

    console.log(`✅ Meta connected: user ${userId} → IG @${profile.username} (${profile.followers_count} followers)`)
    res.redirect(`${frontendBase}/insights?connected=true`)
  } catch (err) {
    console.error('Meta callback error:', err.message)
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/insights?error=${encodeURIComponent(err.message)}`)
  }
})

// ── GET /api/meta/status ───────────────────────────────────
// Check if the user has a Meta connection and return profile summary
router.get('/status', authenticate, async (req, res) => {
  try {
    const result = await query(
      'SELECT ig_user_id, page_name, profile, token_expires_at, connected_at FROM zyana.meta_connections WHERE user_id = $1',
      [req.user.id]
    )
    if (!result.rows.length) return res.json({ connected: false })

    const conn = result.rows[0]
    const expired = conn.token_expires_at && new Date(conn.token_expires_at) < new Date()
    res.json({
      connected: !expired,
      expired,
      pageName: conn.page_name,
      profile: conn.profile,
      connectedAt: conn.connected_at,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/meta/insights ─────────────────────────────────
// Pull live Instagram insights for the last 30 days
router.get('/insights', authenticate, async (req, res) => {
  try {
    const connResult = await query(
      'SELECT ig_user_id, access_token, profile, token_expires_at FROM zyana.meta_connections WHERE user_id = $1',
      [req.user.id]
    )
    if (!connResult.rows.length) return res.status(404).json({ error: 'Instagram not connected' })

    const { ig_user_id, access_token, profile } = connResult.rows[0]

    // Date range: last 30 days
    const until = Math.floor(Date.now() / 1000)
    const since = until - 30 * 24 * 60 * 60

    // Fetch account-level insights
    const insightsMetrics = ['impressions', 'reach', 'profile_views', 'website_clicks', 'follower_count'].join(',')
    const insightsRes = await fetch(
      `${META_API}/${ig_user_id}/insights?metric=${insightsMetrics}&period=day&since=${since}&until=${until}&access_token=${access_token}`
    )
    const insightsData = await insightsRes.json()

    // Fetch recent media
    const mediaRes = await fetch(
      `${META_API}/${ig_user_id}/media?fields=id,caption,media_type,timestamp,like_count,comments_count,thumbnail_url,media_url&limit=12&access_token=${access_token}`
    )
    const mediaData = await mediaRes.json()

    // Fetch media insights for top posts
    const topPosts = []
    if (mediaData.data?.length) {
      for (const post of mediaData.data.slice(0, 6)) {
        try {
          const postInsightsRes = await fetch(
            `${META_API}/${post.id}/insights?metric=impressions,reach,engagement&access_token=${access_token}`
          )
          const postInsights = await postInsightsRes.json()
          const metrics = {}
          postInsights.data?.forEach(m => { metrics[m.name] = m.values?.[0]?.value || 0 })
          topPosts.push({ ...post, insights: metrics })
        } catch {}
      }
    }

    // Parse insights into a clean time-series structure
    const series = {}
    insightsData.data?.forEach(metric => {
      series[metric.name] = metric.values?.map(v => ({
        date: v.end_time?.split('T')[0],
        value: v.value,
      })) || []
    })

    // Calculate totals for the period
    const sum = (arr) => arr.reduce((a, b) => a + (b.value || 0), 0)
    const last = (arr) => arr?.[arr.length - 1]?.value || 0

    const totals = {
      impressions: sum(series.impressions || []),
      reach: sum(series.reach || []),
      profileViews: sum(series.profile_views || []),
      websiteClicks: sum(series.website_clicks || []),
      followers: last(series.follower_count) || profile.followers_count || 0,
      posts: profile.media_count || 0,
    }

    // Engagement rate
    const totalLikes = topPosts.reduce((a, p) => a + (p.like_count || 0), 0)
    const totalComments = topPosts.reduce((a, p) => a + (p.comments_count || 0), 0)
    totals.engagementRate = totals.followers
      ? (((totalLikes + totalComments) / Math.max(topPosts.length, 1)) / totals.followers * 100).toFixed(2)
      : '0.00'

    res.json({
      profile,
      totals,
      series,
      topPosts,
      media: mediaData.data || [],
    })
  } catch (err) {
    console.error('Instagram insights error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── DELETE /api/meta/disconnect ────────────────────────────
router.delete('/disconnect', authenticate, async (req, res) => {
  await query('DELETE FROM zyana.meta_connections WHERE user_id = $1', [req.user.id])
  await query(
    `UPDATE zyana.user_platforms SET metrics = '{}', synced_at = NULL WHERE user_id = $1 AND platform = 'instagram'`,
    [req.user.id]
  )
  res.json({ message: 'Instagram disconnected' })
})

export default router
