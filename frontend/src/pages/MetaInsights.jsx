import { useState, useEffect } from 'react'
import { api } from '../api.js'

function formatNum(n) {
  if (!n && n !== 0) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
  return n.toLocaleString()
}

function MetricCard({ label, value, sub, color = 'var(--accent-sage)', icon }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{sub}</div>}
    </div>
  )
}

function MiniBar({ value, max, color = '#E1306C' }) {
  const pct = max ? Math.min((value / max) * 100, 100) : 0
  return (
    <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
    </div>
  )
}

function PostCard({ post }) {
  const engagement = (post.like_count || 0) + (post.comments_count || 0)
  const imgSrc = post.thumbnail_url || post.media_url

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {imgSrc && (
        <div style={{ height: 160, background: 'var(--surface-2)', overflow: 'hidden' }}>
          <img src={imgSrc} alt="post" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
          <span>❤️ {formatNum(post.like_count || 0)}</span>
          <span>💬 {formatNum(post.comments_count || 0)}</span>
          <span style={{ marginLeft: 'auto', color: 'var(--text-dim)' }}>
            {post.media_type === 'VIDEO' ? '🎬' : post.media_type === 'CAROUSEL_ALBUM' ? '🖼️' : '📸'}
          </span>
        </div>
        {post.insights?.reach > 0 && (
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            👁️ {formatNum(post.insights.reach)} reach · ✨ {formatNum(post.insights.impressions)} impr
          </div>
        )}
        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
          {new Date(post.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </div>
      </div>
    </div>
  )
}

function SparkLine({ series = [], color = '#E1306C' }) {
  if (!series.length) return <div style={{ height: 60, color: 'var(--text-dim)', fontSize: 12, display: 'flex', alignItems: 'center' }}>No data yet</div>
  const values = series.map(d => d.value || 0)
  const max = Math.max(...values) || 1
  const min = Math.min(...values)
  const h = 60
  const w = 300
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / (max - min || 1)) * h
    return `${x},${y}`
  }).join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: h, overflow: 'visible' }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
      />
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        fill="url(#grad)"
        points={`0,${h} ${pts} ${w},${h}`}
      />
    </svg>
  )
}

export default function MetaInsights() {
  const [status, setStatus]       = useState(null)
  const [insights, setInsights]   = useState(null)
  const [loading, setLoading]     = useState(true)
  const [scraping, setScraping]   = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError]         = useState(null)
  const [username, setUsername]   = useState('')
  // 'idle' | 'scrapegraph' | 'meta'
  const [dataSource, setDataSource] = useState('idle')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('connected')) window.history.replaceState({}, '', '/insights')
    const err = params.get('error')
    if (err) {
      setError(decodeURIComponent(err))
      window.history.replaceState({}, '', '/insights')
    }
  }, [])

  useEffect(() => {
    api.getMetaStatus()
      .then(s => {
        setStatus(s)
        if (s.connected) {
          setDataSource('meta')
          loadMetaInsights()
        }
      })
      .catch(() => setStatus({ connected: false }))
      .finally(() => setLoading(false))
  }, [])

  async function loadMetaInsights() {
    setScraping(true)
    try {
      const data = await api.getMetaInsights()
      setInsights(data)
      setDataSource('meta')
    } catch (err) {
      setError(err.message)
    } finally {
      setScraping(false)
    }
  }

  // ── Fix B: ScrapeGraph public fetch ──
  async function handleScrapePublic(e) {
    e.preventDefault()
    if (!username.trim()) return
    setScraping(true)
    setError(null)
    setInsights(null)
    try {
      const data = await api.post('/meta/scrape-public', { username: username.replace(/^@/, '') })
      setInsights(data)
      setDataSource('scrapegraph')
      setStatus({ connected: true, profile: data.profile })
    } catch (err) {
      setError(err.message || 'Failed to fetch Instagram data. The account may be private.')
    } finally {
      setScraping(false)
    }
  }

  async function handleMetaConnect() {
    setConnecting(true)
    setError(null)
    try {
      const { url } = await api.getMetaAuthUrl()
      window.location.href = url
    } catch {
      setError('Meta OAuth not configured. Use the username lookup above instead.')
      setConnecting(false)
    }
  }

  async function handleDisconnect() {
    if (!confirm('Clear Instagram data?')) return
    if (dataSource === 'meta') await api.disconnectMeta()
    setStatus({ connected: false })
    setInsights(null)
    setDataSource('idle')
    setUsername('')
  }

  if (loading) {
    return <div style={{ padding: '40px 32px', color: 'var(--text-dim)' }}>Loading...</div>
  }

  return (
    <div style={{ padding: '32px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>📸 Instagram Insights</h1>
          <p style={{ color: 'var(--text-dim)', marginTop: 6, fontSize: 14 }}>
            {dataSource === 'meta'
              ? 'Live data · Meta Graph API · 30-day window'
              : dataSource === 'scrapegraph'
              ? 'Public data · AI-powered scrape · No login required'
              : 'Enter your handle or connect via Meta'}
          </p>
        </div>
        {insights && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', fontSize: 13 }}>
              {status?.profile?.profile_picture_url && (
                <img src={status.profile.profile_picture_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
              )}
              <span style={{ fontWeight: 600 }}>@{status?.profile?.username}</span>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: dataSource === 'meta' ? '#22c55e22' : '#6366f122', color: dataSource === 'meta' ? '#22c55e' : '#818cf8' }}>
                {dataSource === 'meta' ? '● META LIVE' : '● PUBLIC'}
              </span>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={handleDisconnect}>Clear</button>
            <button className="btn btn-sm" style={{ background: '#E1306C', color: '#fff', border: 'none' }}
              onClick={() => dataSource === 'meta' ? loadMetaInsights() : handleScrapePublic({ preventDefault: ()=>{} })}>
              Refresh
            </button>
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '14px 18px', marginBottom: 24, color: '#991b1b', fontSize: 13 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* ── Connect panel (shown when no data yet) ── */}
      {!insights && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 780, margin: '0 auto 40px', alignItems: 'start' }}>

          {/* Fix B — ScrapeGraph (primary) */}
          <div style={{ background: 'var(--surface)', border: '2px solid #6366f1', borderRadius: 16, padding: '28px 24px' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px' }}>Quick Lookup</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, lineHeight: 1.5, marginBottom: 20 }}>
              Enter any <strong>public</strong> Instagram handle. No login, no Meta app required.
            </p>
            <form onSubmit={handleScrapePublic} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px 0 0 8px', color: 'var(--text-dim)', fontSize: 15 }}>@</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="yourhandle"
                  required
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '0 8px 8px 0', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 14, outline: 'none' }}
                />
              </div>
              <button
                type="submit"
                disabled={scraping || !username.trim()}
                style={{ padding: '12px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: scraping ? 0.7 : 1 }}
              >
                {scraping ? '⏳ Fetching...' : '🔍 Fetch Metrics'}
              </button>
            </form>
            <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-dim)' }}>
              ✓ Works for public accounts · No Meta App ID needed
            </div>
          </div>

          {/* Meta OAuth (secondary) */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 24px' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px' }}>Full Analytics</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, lineHeight: 1.5, marginBottom: 20 }}>
              Connect via Meta for private insights: reach, impressions, story views, follower growth over time.
            </p>
            <button
              onClick={handleMetaConnect}
              disabled={connecting}
              style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #E1306C, #833AB4)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: connecting ? 0.7 : 1 }}
            >
              {connecting ? 'Redirecting...' : '🔗 Connect via Meta OAuth'}
            </button>
            <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-dim)' }}>
              Requires: Meta Developer App · Business/Creator account
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {scraping && !insights && (
        <div style={{ color: 'var(--text-dim)', padding: '40px 0', textAlign: 'center' }}>
          {dataSource === 'meta' ? '⏳ Fetching live data from Meta Graph API...' : '⏳ Scraping public Instagram data...'}
        </div>
      )}

      {/* Insights loaded */}
      {insights && !scraping && (
        <>
          {/* KPI Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
            <MetricCard icon="👥" label="Followers" value={formatNum(insights.totals.followers)} color="#E1306C" />
            {dataSource === 'meta' ? (
              <>
                <MetricCard icon="👁️" label="30d Reach" value={formatNum(insights.totals.reach)} color="#833AB4" sub="unique accounts" />
                <MetricCard icon="✨" label="30d Impressions" value={formatNum(insights.totals.impressions)} color="#F56040" />
                <MetricCard icon="📊" label="Profile Views" value={formatNum(insights.totals.profileViews)} color="#FCAF45" />
              </>
            ) : (
              <>
                <MetricCard icon="❤️" label="Avg Likes" value={formatNum(insights.totals.avgLikes)} color="#F56040" sub="per post" />
                <MetricCard icon="💬" label="Avg Comments" value={formatNum(insights.totals.avgComments)} color="#FCAF45" sub="per post" />
                <MetricCard icon="🖼️" label="Posts" value={formatNum(insights.totals.posts)} color="#833AB4" />
              </>
            )}
            <MetricCard icon="💫" label="Engagement Rate" value={`${insights.totals.engagementRate}%`} color="#22c55e" sub="likes + comments / followers" />
            <MetricCard icon="👤" label="Following" value={formatNum(insights.totals.following)} color="var(--accent-sage)" />
          </div>

          {/* Chart section — Meta only */}
          {dataSource === 'meta' && insights.series && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
              {[
                { key: 'impressions', label: 'Impressions', color: '#F56040' },
                { key: 'reach', label: 'Reach', color: '#833AB4' },
                { key: 'profile_views', label: 'Profile Views', color: '#FCAF45' },
                { key: 'follower_count', label: 'Follower Growth', color: '#E1306C' },
              ].map(({ key, label, color }) => (
                <div key={key} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{label} — 30 days</div>
                  <SparkLine series={insights.series[key] || []} color={color} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>
                    <span>30 days ago</span><span>Today</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ScrapeGraph — upgrade prompt */}
          {dataSource === 'scrapegraph' && (
            <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 24, fontSize: 13 }}>
              <strong>⚡ Quick Lookup active</strong> — showing public metrics only.
              <span style={{ color: 'var(--text-dim)', marginLeft: 8 }}>Connect via Meta OAuth to unlock reach, impressions, story views, and 30-day trend charts.</span>
            </div>
          )}

          {/* Top Posts */}
          {insights.topPosts?.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
                🏆 Recent Posts ({insights.topPosts.length})
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14 }}>
                {insights.topPosts.map((post, i) => <PostCard key={post.id || i} post={post} />)}
              </div>
            </div>
          )}

          {/* Setup Guide if this is first connect */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(225,48,108,0.08), rgba(131,58,180,0.08))',
            border: '1px solid rgba(225,48,108,0.2)',
            borderRadius: 12,
            padding: '20px 24px',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>📈 Monetization Readiness</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {[
                { threshold: 1000, label: 'Story links', reached: insights.totals.followers >= 1000 },
                { threshold: 10000, label: 'Paid partnerships baseline', reached: insights.totals.followers >= 10000 },
                { threshold: 50000, label: 'Collabs monetization', reached: insights.totals.followers >= 50000 },
                { threshold: 100000, label: 'Brand deal premium tier', reached: insights.totals.followers >= 100000 },
              ].map(({ threshold, label, reached }) => (
                <div key={threshold} style={{
                  background: reached ? 'rgba(34,197,94,0.1)' : 'var(--surface)',
                  border: `1px solid ${reached ? '#22c55e' : 'var(--border)'}`,
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 13,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                    {reached ? '✅' : '🔒'} {formatNum(threshold)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{label}</div>
                  {!reached && (
                    <div style={{ fontSize: 11, color: '#E1306C', marginTop: 4 }}>
                      {formatNum(threshold - insights.totals.followers)} to go
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Setup guide */}
      <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>⚡ Quick Lookup Setup (Fix B)</div>
          <div style={{ color: 'var(--text-dim)', lineHeight: 1.8 }}>
            <div>1. Get a free API key at <strong>dashboard.scrapegraphai.com</strong></div>
            <div>2. Add to <code style={{ background: 'var(--surface-2)', padding: '1px 5px', borderRadius: 4 }}>backend/.env</code>:</div>
            <div style={{ fontFamily: 'monospace', background: 'var(--surface-2)', padding: '8px 12px', borderRadius: 6, marginTop: 4 }}>SGAI_API_KEY=your_key_here</div>
            <div style={{ marginTop: 8, color: '#22c55e' }}>✓ Works for any public Instagram account</div>
          </div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>📊 Full Meta OAuth Setup</div>
          <ol style={{ margin: 0, paddingLeft: 18, color: 'var(--text-dim)', lineHeight: 2 }}>
            <li>developers.facebook.com → Create App → Business</li>
            <li>Add Instagram Graph API product</li>
            <li>Copy App ID + Secret → <code style={{ background: 'var(--surface-2)', padding: '1px 5px', borderRadius: 4 }}>backend/.env</code></li>
            <li>Add callback URL to Valid OAuth Redirect URIs</li>
            <li>Submit for Advanced Access on <code>instagram_manage_insights</code></li>
          </ol>
        </div>
      </div>
    </div>
  )
}
