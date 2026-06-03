const SGAI_API = process.env.SGAI_API_URL || 'https://api.scrapegraphai.com/v1/smartscraper'

export function isScrapegraphConfigured() {
  return Boolean(process.env.SGAI_API_KEY?.trim())
}

export async function extractInstagramProfile(handle) {
  const apiKey = process.env.SGAI_API_KEY?.trim()
  if (!apiKey) throw new Error('SGAI_API_KEY not configured on server')

  const profileUrl = `https://www.instagram.com/${handle.replace(/^@/, '').trim()}/`

  const res = await fetch(SGAI_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'SGAI-APIKEY': apiKey,
    },
    body: JSON.stringify({
      website_url: profileUrl,
      user_prompt: `Extract this Instagram profile's public data as JSON:
- username (string)
- full_name (string)
- bio (string)
- followers_count (number)
- following_count (number)
- posts_count (number)
- is_verified (boolean)
- profile_pic_url (string or null)
- recent_posts: array of up to 12 posts, each with:
    - like_count (number)
    - comments_count (number)
    - caption (string, first 120 chars)
    - media_type (IMAGE | VIDEO | CAROUSEL)
    - timestamp (ISO string if visible, else null)
Return only valid JSON, no markdown.`,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`ScrapeGraph error ${res.status}: ${errText}`)
  }

  const data = await res.json()
  let profile = data.result
  if (typeof profile === 'string') {
    try { profile = JSON.parse(profile) } catch { profile = {} }
  }

  return { profile: profile || {}, profileUrl }
}

export function normaliseInstagramProfile(profile, handle) {
  const posts = (profile.recent_posts || []).map(p => ({
    like_count: p.like_count || 0,
    comments_count: p.comments_count || 0,
    caption: p.caption || '',
    media_type: p.media_type || 'IMAGE',
    timestamp: p.timestamp || null,
  }))

  const normalised = {
    username: profile.username || handle,
    name: profile.full_name || profile.name || handle,
    biography: profile.bio || profile.biography || '',
    followers_count: profile.followers_count || profile.followers || 0,
    follows_count: profile.following_count || profile.following || 0,
    media_count: profile.posts_count || profile.posts || 0,
    is_verified: profile.is_verified || false,
    profile_picture_url: profile.profile_pic_url || null,
  }

  const totalLikes = posts.reduce((a, p) => a + p.like_count, 0)
  const totalComments = posts.reduce((a, p) => a + p.comments_count, 0)
  const engagementRate = normalised.followers_count && posts.length
    ? (((totalLikes + totalComments) / posts.length) / normalised.followers_count * 100).toFixed(2)
    : '0.00'

  const totals = {
    followers: normalised.followers_count,
    following: normalised.follows_count,
    posts: normalised.media_count,
    engagementRate,
    avgLikes: posts.length ? Math.round(totalLikes / posts.length) : 0,
    avgComments: posts.length ? Math.round(totalComments / posts.length) : 0,
  }

  return { profile: normalised, totals, topPosts: posts }
}
