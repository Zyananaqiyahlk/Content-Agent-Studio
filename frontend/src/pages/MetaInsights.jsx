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
  const [status, setStatus]   = useState(null)    // null | { connected, profile, ... }
  const [insights, setInsights] = useState(null)  // null | full insights object
  const [loading, setLoading] = useState(true)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState(null)
  const [activeMetric, setActiveMetric] = useState('impressions')

  // Check OAuth callback params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const connected = params.get('connected')
    const err = params.get('error')
    if (connected) {
      window.history.replaceState({}, '', '/insights')
    }
    if (err) {
      setError(decodeURIComponent(err))
      window.history.replaceState({}, '', '/insights')
    }
  }, [])

  useEffect(() => {
    api.getMetaStatus()
      .then(s => {
        setStatus(s)
        if (s.connected) loadInsights()
      })
      .catch(() => setStatus({ connected: false }))
      .finally(() => setLoading(false))
  }, [])

  async function loadInsights() {
    setInsightsLoading(true)
    try {
      const data = await api.getMetaInsights()
      setInsights(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setInsightsLoading(false)
    }
  }

  async function handleConnect() {
    setConnecting(true)
    setError(null)
    try {
      const { url } = await api.getMetaAuthUrl()
      window.location.href = url
    } catch (err) {
      setError('META_APP_ID not configured on the server. Add META_APP_ID, META_APP_SECRET, and META_REDIRECT_URI to your backend .env file.')
      setConnecting(false)
    }
  }

  async function handleDisconnect() {
    if (!confirm('Disconnect your Instagram account?')) return
    await api.disconnectMeta()
    setStatus({ connected: false })
    setInsights(null)
  }

  if (loading) {
    return (
      <div style={{ padding: '40px 32px', color: 'var(--text-dim)' }}>
        Loading Instagram connection...
      </div>
    )
  }

  return (
    <div style={{ padding: '32px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>
            📸 Instagram Live Insights
          </h1>
          <p style={{ color: 'var(--text-dim)', marginTop: 6, fontSize: 14 }}>
            Real-time analytics from Meta Graph API · 30-day window
          </p>
        </div>
        {status?.connected ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '8px 14px', fontSize: 13
            }}>
              {status.profile?.profile_picture_url && (
                <img src={status.profile.profile_picture_url} alt="avatar" style={{ width: 28, height: 28, borderRadius: '50%' }} />
              )}
              <span style={{ fontWeight: 600 }}>@{status.profile?.username}</span>
              <span style={{ color: '#22c55e', fontSize: 10 }}>● LIVE</span>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={handleDisconnect}>Disconnect</button>
            <button className="btn btn-sm" style={{ background: '#E1306C', color: '#fff', border: 'none' }} onClick={loadInsights}>
              Refresh
            </button>
          </div>
        ) : (
          <button
            className="btn"
            onClick={handleConnect}
            disabled={connecting}
            style={{ background: 'linear-gradient(135deg, #E1306C, #833AB4)', color: '#fff', border: 'none', padding: '12px 24px', fontWeight: 700 }}
          >
            {connecting ? 'Redirecting to Meta...' : '🔗 Connect Instagram'}
          </button>
        )}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '14px 18px', marginBottom: 24, color: '#991b1b', fontSize: 13 }}>
          <strong>Error:</strong> {error}
          {error.includes('META_APP_ID') && (
            <div style={{ marginTop: 8, fontFamily: 'monospace', background: '#fff1f2', padding: 10, borderRadius: 6, fontSize: 12 }}>
              Add to backend/.env:<br />
              META_APP_ID=your_app_id<br />
              META_APP_SECRET=your_app_secret<br />
              META_REDIRECT_URI=http://localhost:3001/api/meta/callback
            </div>
          )}
        </div>
      )}

      {/* Not connected state */}
      {!status?.connected && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '48px 32px',
          textAlign: 'center',
          maxWidth: 560,
          margin: '0 auto',
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📱</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Connect your Instagram</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Connect your Instagram Business or Creator account to see real-time followers,
            reach, impressions, and top-performing posts — all powered by Meta's Graph API.
          </p>
          <div style={{ textAlign: 'left', background: 'var(--surface-2)', borderRadius: 10, padding: '16px 20px', marginBottom: 24, fontSize: 13 }}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>Requirements:</div>
            {[
              'Instagram Business or Creator account',
              'Facebook Page linked to your Instagram',
              'Admin access to the Facebook Page',
              'Meta Developer App with Graph API access',
            ].map(r => (
              <div key={r} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <span style={{ color: '#22c55e' }}>✓</span> {r}
              </div>
            ))}
          </div>
          <button
            className="btn"
            onClick={handleConnect}
            disabled={connecting}
            style={{ background: 'linear-gradient(135deg, #E1306C, #833AB4)', color: '#fff', border: 'none', padding: '14px 32px', fontWeight: 700, fontSize: 15, width: '100%' }}
          >
            {connecting ? 'Redirecting...' : '🔗 Connect Instagram via Meta'}
          </button>
        </div>
      )}

      {/* Connected + loading insights */}
      {status?.connected && insightsLoading && (
        <div style={{ color: 'var(--text-dim)', padding: '40px 0', textAlign: 'center' }}>
          Fetching live data from Meta Graph API...
        </div>
      )}

      {/* Connected + insights loaded */}
      {status?.connected && insights && !insightsLoading && (
        <>
          {/* KPI Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
            <MetricCard icon="👥" label="Followers" value={formatNum(insights.totals.followers)} color="#E1306C" />
            <MetricCard icon="👁️" label="30d Reach" value={formatNum(insights.totals.reach)} color="#833AB4" sub="unique accounts" />
            <MetricCard icon="✨" label="30d Impressions" value={formatNum(insights.totals.impressions)} color="#F56040" />
            <MetricCard icon="📊" label="Profile Views" value={formatNum(insights.totals.profileViews)} color="#FCAF45" />
            <MetricCard icon="💫" label="Engagement Rate" value={`${insights.totals.engagementRate}%`} color="#22c55e" sub="likes + comments / followers" />
            <MetricCard icon="🖼️" label="Posts" value={insights.totals.posts} color="var(--accent-sage)" />
          </div>

          {/* Chart section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
            {[
              { key: 'impressions', label: 'Impressions', color: '#F56040' },
              { key: 'reach', label: 'Reach', color: '#833AB4' },
              { key: 'profile_views', label: 'Profile Views', color: '#FCAF45' },
              { key: 'follower_count', label: 'Follower Growth', color: '#E1306C' },
            ].map(({ key, label, color }) => (
              <div key={key} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '16px 20px',
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{label} — 30 days</div>
                <SparkLine series={insights.series[key] || []} color={color} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>
                  <span>30 days ago</span>
                  <span>Today</span>
                </div>
              </div>
            ))}
          </div>

          {/* Top Posts */}
          {insights.topPosts?.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🏆 Top Posts (last 12)</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14 }}>
                {insights.topPosts.map(post => <PostCard key={post.id} post={post} />)}
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

      {/* Setup instructions */}
      <div style={{
        marginTop: 32,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '20px 24px',
        fontSize: 13,
        color: 'var(--text-dim)',
      }}>
        <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>🛠 Setup Guide — Meta Developer App</div>
        <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
          <li>Go to <strong>developers.facebook.com</strong> → Create App → Business type</li>
          <li>Add <strong>Instagram Graph API</strong> product to your app</li>
          <li>Get your <strong>App ID</strong> and <strong>App Secret</strong> from Settings → Basic</li>
          <li>Add <code>http://localhost:3001/api/meta/callback</code> to Valid OAuth Redirect URIs</li>
          <li>Add to <code>backend/.env</code>: <code>META_APP_ID</code>, <code>META_APP_SECRET</code>, <code>META_REDIRECT_URI</code></li>
          <li>For production: submit for <strong>Advanced Access</strong> on <code>instagram_manage_insights</code></li>
        </ol>
      </div>
    </div>
  )
}
