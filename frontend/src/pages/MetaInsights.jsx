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

function GrowthPlan({ text }) {
  if (!text) return null
  const sections = text.split(/^## /m).filter(Boolean)
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>🚀 Your Growth Plan</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sections.map((block, i) => {
          const [title, ...rest] = block.split('\n')
          return (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ fontWeight: 700, marginBottom: 8, color: '#6366f1' }}>{title.trim()}</div>
              <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                {rest.join('\n').trim()}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function MetaInsights() {
  const [config, setConfig]         = useState({ scrapegraphConfigured: false, metaConfigured: false })
  const [status, setStatus]       = useState(null)
  const [insights, setInsights]   = useState(null)
  const [growthPlan, setGrowthPlan] = useState('')
  const [loading, setLoading]     = useState(true)
  const [scraping, setScraping]   = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError]         = useState(null)
  const [username, setUsername]   = useState('')
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
    Promise.all([
      api.getMetaConfig().catch(() => ({ scrapegraphConfigured: false, metaConfigured: false })),
      api.getMetaStatus().catch(() => ({ connected: false })),
    ]).then(([cfg, s]) => {
      setConfig(cfg)
      setStatus(s)
      if (s.connected) {
        setDataSource('meta')
        loadMetaInsights()
      }
    }).finally(() => setLoading(false))
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

  async function handleScrapePublic(e) {
    e?.preventDefault?.()
    if (!username.trim()) return
    setScraping(true)
    setError(null)
    setInsights(null)
    setGrowthPlan('')
    try {
      const data = await api.scrapeInstagram({ username: username.replace(/^@/, ''), includeGrowthPlan: true })
      setInsights(data)
      setGrowthPlan(data.growthPlan || '')
      setDataSource('scrapegraph')
      setStatus({ connected: true, profile: data.profile })
    } catch (err) {
      if (err.code === 'INSUFFICIENT_CREDITS') {
        setError(`Need ${err.needed} credits for growth coaching (you have ${err.balance}). Metrics were fetched — top up credits and refresh the plan.`)
        if (err.balance !== undefined) {
          // partial response may be in error payload from backend - not standard, skip
        }
      } else {
        setError(err.message || 'Failed to analyze Instagram. The account may be private.')
      }
    } finally {
      setScraping(false)
    }
  }

  async function regenerateGrowthPlan() {
    if (!insights?.profile || !insights?.totals) return
    setScraping(true)
    setError(null)
    try {
      const data = await api.getInstagramGrowthPlan({
        username: insights.profile.username,
        profile: insights.profile,
        totals: insights.totals,
        topPosts: insights.topPosts,
      })
      setGrowthPlan(data.growthPlan || '')
    } catch (err) {
      setError(err.message)
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
    setGrowthPlan('')
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
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>📸 Instagram Growth Coach</h1>
          <p style={{ color: 'var(--text-dim)', marginTop: 6, fontSize: 14 }}>
            {dataSource === 'meta'
              ? 'Live data · Meta Graph API · 30-day window'
              : dataSource === 'scrapegraph'
              ? 'Public profile analysis · AI growth tips · powered by ScrapeGraph'
              : 'Enter a public handle — your agent will analyze posts and recommend how to grow'}
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
              onClick={() => dataSource === 'meta' ? loadMetaInsights() : handleScrapePublic({ preventDefault: () => {} })}>
              Refresh
            </button>
            {dataSource === 'scrapegraph' && (
              <button className="btn btn-secondary btn-sm" onClick={regenerateGrowthPlan} disabled={scraping}>
                Regenerate plan
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '14px 18px', marginBottom: 24, color: '#991b1b', fontSize: 13 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {!config.scrapegraphConfigured && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '14px 18px', marginBottom: 24, color: '#92400e', fontSize: 13 }}>
          <strong>Server setup required.</strong> Add <code>SGAI_API_KEY</code> to your backend <code>.env</code> file (from{' '}
          <a href="https://dashboard.scrapegraphai.com" target="_blank" rel="noreferrer">dashboard.scrapegraphai.com</a>
          ), then restart the backend. End users never enter the API key in this app.
        </div>
      )}

      {/* ── Connect panel (shown when no data yet) ── */}
      {!insights && config.scrapegraphConfigured && (
        <div style={{ display: 'grid', gridTemplateColumns: config.metaConfigured ? '1fr 1fr' : '1fr', gap: 20, maxWidth: 780, margin: '0 auto 40px', alignItems: 'start' }}>

          {/* Fix B — ScrapeGraph (primary) */}
          <div style={{ background: 'var(--surface)', border: '2px solid #6366f1', borderRadius: 16, padding: '28px 24px' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px' }}>Analyze & Grow</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, lineHeight: 1.5, marginBottom: 20 }}>
              Enter any <strong>public</strong> Instagram handle. Your AI agent reviews posts, engagement, and bio — then recommends content ideas to grow followers.
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
                {scraping ? '⏳ Analyzing profile...' : '🚀 Analyze & Get Growth Tips'}
              </button>
            </form>
            <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-dim)' }}>
              ✓ Uses your server API key · Costs a few credits for AI coaching
            </div>
          </div>

          {/* Meta OAuth (secondary) */}
          {config.metaConfigured && (
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
          )}
        </div>
      )}

      {/* Loading state */}
      {scraping && !insights && (
        <div style={{ color: 'var(--text-dim)', padding: '40px 0', textAlign: 'center' }}>
          {dataSource === 'meta' ? '⏳ Fetching live data from Meta Graph API...' : '⏳ Scraping Instagram & generating your growth plan...'}
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
              <strong>⚡ Public profile analysis</strong>
              {config.metaConfigured && (
                <span style={{ color: 'var(--text-dim)', marginLeft: 8 }}>Connect via Meta OAuth to unlock reach, impressions, and 30-day trend charts.</span>
              )}
            </div>
          )}

          <GrowthPlan text={growthPlan} />

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

      {!config.scrapegraphConfigured && !config.metaConfigured && (
        <div style={{ marginTop: 32, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', fontSize: 13, color: 'var(--text-dim)' }}>
          <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Admin setup</div>
          <p style={{ margin: '0 0 8px' }}>Add <code>SGAI_API_KEY</code> to <code>backend/.env</code> to enable Instagram analysis for all users.</p>
          <p style={{ margin: 0 }}>Optionally add <code>META_APP_ID</code> and <code>META_APP_SECRET</code> for full OAuth analytics.</p>
        </div>
      )}
    </div>
  )
}
