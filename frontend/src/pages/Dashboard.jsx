import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api.js'

const PLATFORM_META = {
  youtube:   { icon: '▶️', label: 'YouTube',   color: '#FF0000', metricKey: 'subscribers', metricLabel: 'subscribers' },
  instagram: { icon: '📸', label: 'Instagram', color: '#E1306C', metricKey: null, metricLabel: 'followers' },
  tiktok:    { icon: '🎵', label: 'TikTok',    color: '#010101', metricKey: null, metricLabel: 'followers' },
  linkedin:  { icon: '💼', label: 'LinkedIn',  color: '#0A66C2', metricKey: null, metricLabel: 'connections' },
  twitter:   { icon: '𝕏',  label: 'X / Twitter', color: '#1DA1F2', metricKey: null, metricLabel: 'followers' },
}

function formatCount(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
  return n?.toLocaleString() || '—'
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function getDailyTasks(niche) {
  const tasks = {
    fitness:  ['Film 60-sec morning routine reel', 'Reply to 10 comments', 'Research trending fitness audio', 'Post a poll: "What\'s your goal this week?"'],
    beauty:   ['Post a GRWM reel', 'Research trending beauty products', 'Reply to DMs from yesterday', 'Create a carousel: "Top 5 skincare tips"'],
    food:     ['Film a recipe reel under 60 seconds', 'Engage with 5 food creators', 'Draft 3 caption ideas', 'Research seasonal trending ingredients'],
    tech:     ['Post a "hot take" tech opinion', 'Research 1 trending tech topic', 'Reply to all comments', 'Draft next week\'s script ideas'],
    finance:  ['Share a money-saving tip reel', 'Reply to DM questions', 'Research viral finance topics', 'Draft an outreach email to a fintech brand'],
    default:  ['Post your daily content piece', 'Engage with 10 accounts in your niche', 'Reply to all comments from yesterday', 'Research 3 trending topics in your space'],
  }
  return (tasks[niche] || tasks.default).map((text, i) => ({ id: i, text, done: false }))
}

const TODAY = new Date().toISOString().split('T')[0]
const GOAL_KEY = 'follower_goal'
const TASKS_KEY = 'daily_tasks'

const QUICK_ACTIONS = [
  { to: '/scripts',  icon: '🎬', label: 'Generate Script',  sub: '5 credits', variant: 'sage'   },
  { to: '/studio',   icon: '🎥', label: 'Create Video',     sub: 'AI Avatar',  variant: 'golden' },
  { to: '/chat',     icon: '🤖', label: 'Ask AI Agent',     sub: '3 credits',  variant: 'coral'  },
  { to: '/outreach', icon: '📧', label: 'Write Outreach',   sub: '5 credits',  variant: 'purple' },
]

export default function Dashboard() {
  const { user, credits } = useAuth()
  const location = useLocation()

  const [platforms, setPlatforms] = useState([])
  const [scripts, setScripts]     = useState([])
  const [welcome, setWelcome]     = useState(location.state?.welcome || false)
  const [syncing, setSyncing]     = useState(false)

  const [goal, setGoal] = useState(() => {
    try { return JSON.parse(localStorage.getItem(GOAL_KEY)) || { current: 0, target: 10000, date: '' } }
    catch { return { current: 0, target: 10000, date: '' } }
  })
  const [editGoal, setEditGoal]   = useState(false)
  const [goalForm, setGoalForm]   = useState(goal)

  const [tasks, setTasks] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(TASKS_KEY))
      if (saved?.date === TODAY) return saved.tasks
    } catch {}
    return getDailyTasks(user?.niche)
  })

  useEffect(() => {
    if (welcome) { const t = setTimeout(() => setWelcome(false), 5000); return () => clearTimeout(t) }
  }, [welcome])

  useEffect(() => {
    api.getPlatforms().then(setPlatforms).catch(() => {})
    api.getScripts().then(setScripts).catch(() => {})
  }, [])

  function toggleTask(id) {
    const updated = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t)
    setTasks(updated)
    localStorage.setItem(TASKS_KEY, JSON.stringify({ date: TODAY, tasks: updated }))
  }

  function saveGoal() {
    setGoal(goalForm)
    localStorage.setItem(GOAL_KEY, JSON.stringify(goalForm))
    setEditGoal(false)
  }

  async function syncYouTube() {
    setSyncing(true)
    try {
      const metrics = await api.syncYouTube()
      setPlatforms(prev => prev.map(p => p.platform === 'youtube' ? { ...p, metrics, synced_at: new Date().toISOString() } : p))
    } catch (err) {
      console.error('YouTube sync failed:', err.message)
    } finally {
      setSyncing(false)
    }
  }

  const connectedPlatforms = platforms.filter(p => p.handle)
  const doneTasks = tasks.filter(t => t.done).length
  const progress  = Math.min(100, goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0)
  const bp        = user?.brandPreferences || {}

  return (
    <div className="dashboard">

      {welcome && (
        <div className="alert success">
          🎉 Welcome to Zyana Studio! You have {location.state?.credits || 25} free credits to get started.
        </div>
      )}

      {/* ── Hero banner ─────────────────────────────────── */}
      <div className="dash-hero">
        <div className="dash-hero-left">
          <div className="dash-hero-greeting">
            Good {getTimeOfDay()}, {user?.name?.split(' ')[0] || 'Creator'} 👋
          </div>
          <div className="dash-hero-brand">
            {user?.brandName || 'Your Studio'}
            {user?.niche && <span className="dash-hero-niche">{user.niche}</span>}
          </div>
          {bp.bio || user?.bio ? (
            <p className="dash-hero-bio">{bp.bio || user.bio}</p>
          ) : (
            <p className="dash-hero-bio dim">Add your bio in Settings to personalise your AI content →</p>
          )}
        </div>
        <div className="dash-hero-actions">
          <Link to="/scripts"  className="btn btn-primary">+ New Script</Link>
          <Link to="/studio"   className="btn btn-golden">🎥 Studio</Link>
          <Link to="/outreach" className="btn btn-secondary">📧 Outreach</Link>
        </div>
      </div>

      {/* ── Stat strip ──────────────────────────────────── */}
      <div className="stat-grid">
        <div className="stat-card sage">
          <div className="label">Credits</div>
          <div className="value" style={{ color: 'var(--sage)' }}>{credits}</div>
          <div className="sub"><Link to="/credits">Top up</Link></div>
        </div>
        <div className="stat-card golden">
          <div className="label">Scripts generated</div>
          <div className="value">{scripts.length}</div>
          <div className="sub"><Link to="/scripts">View all</Link></div>
        </div>
        <div className="stat-card coral">
          <div className="label">Tasks done today</div>
          <div className="value">{doneTasks}/{tasks.length}</div>
          <div className="sub">{doneTasks === tasks.length ? '🎯 All done!' : `${tasks.length - doneTasks} left`}</div>
        </div>
        <div className="stat-card">
          <div className="label">Goal progress</div>
          <div className="value">{progress}%</div>
          <div className="sub">{goal.current.toLocaleString()} / {goal.target.toLocaleString()}</div>
        </div>
      </div>

      {/* ── Quick actions ────────────────────────────────── */}
      <div className="quick-actions-grid">
        {QUICK_ACTIONS.map(({ to, icon, label, sub, variant }) => (
          <Link key={to} to={to} className={`quick-action-card qa-${variant}`}>
            <div className="qa-icon">{icon}</div>
            <div className="qa-label">{label}</div>
            <div className="qa-sub">{sub}</div>
          </Link>
        ))}
      </div>

      {/* ── Two-column: platforms + tasks ───────────────── */}
      <div className="dash-two-col">

        {/* Platform metrics */}
        <div className="card">
          <div className="card-header">
            <h3>📡 Platform Metrics</h3>
            <Link to="/settings" style={{ fontSize: 12, color: 'var(--text-dim)' }}>Manage →</Link>
          </div>
          {connectedPlatforms.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📡</div>
              <p>No platforms connected yet.</p>
              <Link to="/settings" className="btn btn-secondary btn-sm" style={{ marginTop: 8 }}>Connect accounts</Link>
            </div>
          ) : (
            <div className="platform-list">
              {connectedPlatforms.map(p => {
                const meta  = PLATFORM_META[p.platform]
                const count = p.metrics?.[meta?.metricKey]
                return (
                  <div key={p.platform} className="platform-row">
                    <div className="platform-icon">{meta?.icon}</div>
                    <div className="platform-info">
                      <div className="platform-name">{meta?.label}</div>
                      <div className="platform-handle">{p.handle}</div>
                    </div>
                    <div className="platform-metric">
                      {count != null ? (
                        <>
                          <span className="metric-value">{formatCount(count)}</span>
                          <span className="metric-label">{meta?.metricLabel}</span>
                        </>
                      ) : (
                        <span className="metric-label dim">
                          {p.platform === 'youtube' && process.env.NODE_ENV !== 'production'
                            ? <button className="btn btn-ghost btn-sm" onClick={syncYouTube} disabled={syncing}>{syncing ? '…' : 'Sync'}</button>
                            : 'handle saved'}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
              {connectedPlatforms.find(p => p.platform === 'youtube' && p.handle) && (
                <button className="btn btn-ghost btn-sm" onClick={syncYouTube} disabled={syncing} style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                  {syncing ? <span className="spinner dark" /> : '🔄 Sync YouTube'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Today's tasks */}
        <div className="card">
          <div className="card-header">
            <h3>✅ Today's tasks</h3>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div className="task-list">
            {tasks.map(task => (
              <div key={task.id} className={`task-item${task.done ? ' done' : ''}`} onClick={() => toggleTask(task.id)}>
                <div className={`task-check${task.done ? ' checked' : ''}`}>{task.done ? '✓' : ''}</div>
                <div className="task-text">{task.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Brand DNA + goal ────────────────────────────── */}
      <div className="dash-two-col">

        {/* Brand DNA */}
        <div className="card">
          <div className="card-header">
            <h3>🧬 Brand DNA</h3>
            <Link to="/settings" style={{ fontSize: 12, color: 'var(--text-dim)' }}>Edit →</Link>
          </div>
          {(!bp.voice && !bp.pillars?.length && !bp.audience) ? (
            <div className="empty-state">
              <div className="icon">🧬</div>
              <p>Define your brand voice and content pillars.</p>
              <Link to="/settings" className="btn btn-secondary btn-sm" style={{ marginTop: 8 }}>Set up Brand DNA</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {bp.voice && (
                <div className="brand-row">
                  <span className="brand-row-label">Voice</span>
                  <span className="badge badge-sage" style={{ textTransform: 'capitalize' }}>{bp.voice}</span>
                </div>
              )}
              {bp.audience && (
                <div className="brand-row">
                  <span className="brand-row-label">Audience</span>
                  <span style={{ fontSize: 13 }}>{bp.audience}</span>
                </div>
              )}
              {bp.pillars?.length > 0 && (
                <div className="brand-row align-start">
                  <span className="brand-row-label">Pillars</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {bp.pillars.map((p, i) => <span key={i} className="badge badge-golden">{p}</span>)}
                  </div>
                </div>
              )}
              {bp.postingFrequency && (
                <div className="brand-row">
                  <span className="brand-row-label">Posts</span>
                  <span style={{ fontSize: 13, textTransform: 'capitalize' }}>{bp.postingFrequency}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Follower goal */}
        <div className="card">
          <div className="card-header">
            <h3>🎯 Follower goal</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => { setGoalForm(goal); setEditGoal(true) }}>Edit</button>
          </div>
          {editGoal ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label>Current followers</label>
                <input type="number" value={goalForm.current} onChange={e => setGoalForm(f => ({ ...f, current: +e.target.value }))} min="0" />
              </div>
              <div className="form-group">
                <label>Goal</label>
                <input type="number" value={goalForm.target} onChange={e => setGoalForm(f => ({ ...f, target: +e.target.value }))} min="1" />
              </div>
              <div className="form-group">
                <label>Target date</label>
                <input type="date" value={goalForm.date} onChange={e => setGoalForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={saveGoal}>Save</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditGoal(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="goal-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-dim)', marginBottom: 8 }}>
                <span>Followers</span>
                {goal.date && <span>by {new Date(goal.date).toLocaleDateString()}</span>}
              </div>
              <div className="progress-bar" style={{ marginBottom: 10 }}>
                <div className="progress-fill sage" style={{ width: `${progress}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>{goal.current.toLocaleString()}</span>
                <span style={{ color: 'var(--sage)', fontWeight: 700 }}>{progress}%</span>
                <span>{goal.target.toLocaleString()}</span>
              </div>
              {goal.target === 10000 && goal.current === 0 && (
                <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8 }}>Tap "Edit" to set your follower goal.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent scripts ───────────────────────────────── */}
      {scripts.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>📄 Recent scripts</h3>
            <Link to="/scripts" style={{ fontSize: 13 }}>View all →</Link>
          </div>
          <div className="script-cards-row">
            {scripts.slice(0, 4).map(s => (
              <div key={s.id} className="script-preview-card">
                <div className="spc-platform">{s.platform || 'Instagram'}</div>
                <div className="spc-topic">{s.topic}</div>
                <div className="spc-meta">
                  <span>{s.format || 'Talking Head'}</span>
                  <span>{new Date(s.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
