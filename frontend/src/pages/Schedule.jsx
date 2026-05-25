import { useState, useEffect } from 'react'
import { api } from '../api.js'

const PLATFORM_COLORS = {
  instagram: '#E1306C',
  tiktok:    '#010101',
  youtube:   '#FF0000',
  linkedin:  '#0A66C2',
  twitter:   '#1DA1F2',
}

const PLATFORM_ICONS = {
  instagram: '📸',
  tiktok:    '🎵',
  youtube:   '▶️',
  linkedin:  '💼',
  twitter:   '𝕏',
}

const CONTENT_TYPES = ['post', 'reel', 'story', 'video', 'carousel', 'live', 'thread']
const STATUS_COLORS = {
  planned:   { bg: 'rgba(99,102,241,0.12)',  text: '#6366f1' },
  ready:     { bg: 'rgba(34,197,94,0.12)',   text: '#22c55e' },
  posted:    { bg: 'rgba(156,163,175,0.15)', text: '#9ca3af' },
  skipped:   { bg: 'rgba(239,68,68,0.12)',   text: '#ef4444' },
}

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.planned
  return (
    <span style={{
      background: c.bg, color: c.text,
      padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
    }}>
      {status}
    </span>
  )
}

function WeekCalendar({ posts, onSelect, onAdd }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay()) // Sunday

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  const postsByDay = {}
  posts.forEach(p => {
    const d = new Date(p.scheduled_at).toDateString()
    if (!postsByDay[d]) postsByDay[d] = []
    postsByDay[d].push(p)
  })

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 32 }}>
      {days.map((day, i) => {
        const key = day.toDateString()
        const dayPosts = postsByDay[key] || []
        const isToday = day.toDateString() === today.toDateString()
        const isPast = day < today

        return (
          <div
            key={key}
            style={{
              background: isToday ? 'rgba(225,48,108,0.06)' : 'var(--surface)',
              border: `1px solid ${isToday ? '#E1306C' : 'var(--border)'}`,
              borderRadius: 10,
              padding: '10px 8px',
              minHeight: 110,
              cursor: 'pointer',
              opacity: isPast ? 0.7 : 1,
            }}
            onClick={() => onAdd(day)}
          >
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 2 }}>{DAY_LABELS[i]}</div>
            <div style={{
              fontSize: 18, fontWeight: 700,
              color: isToday ? '#E1306C' : 'var(--text)',
              marginBottom: 8,
            }}>
              {day.getDate()}
            </div>
            {dayPosts.map(p => (
              <div
                key={p.id}
                onClick={e => { e.stopPropagation(); onSelect(p) }}
                style={{
                  background: PLATFORM_COLORS[p.platform] || 'var(--accent-sage)',
                  borderRadius: 4,
                  padding: '2px 6px',
                  fontSize: 10,
                  color: '#fff',
                  marginBottom: 3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
              >
                {PLATFORM_ICONS[p.platform]} {p.content_type}
              </div>
            ))}
            {dayPosts.length === 0 && !isPast && (
              <div style={{ fontSize: 10, color: 'var(--text-dim)', textAlign: 'center', marginTop: 8 }}>+ add</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function OptimalTimesPanel({ times }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 24,
    }}>
      <button
        style={{
          width: '100%', textAlign: 'left', background: 'none', border: 'none',
          padding: '16px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', color: 'var(--text)', fontWeight: 700, fontSize: 14,
        }}
        onClick={() => setOpen(!open)}
      >
        ⚡ Monetization-Optimized Posting Windows
        <span style={{ fontSize: 18, color: 'var(--text-dim)' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && times && (
        <div style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {Object.entries(times).map(([platform, windows]) => (
            <div key={platform}>
              <div style={{ fontSize: 12, fontWeight: 700, color: PLATFORM_COLORS[platform], marginBottom: 8 }}>
                {PLATFORM_ICONS[platform]} {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </div>
              {windows.map((w, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12,
                }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{w.day} {w.time}</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: 11 }}>{w.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MonetizationGates({ gates }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🎯 Creator Monetization Milestones</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {Object.entries(gates).map(([platform, gate]) => (
          <div key={platform} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '16px 18px',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: PLATFORM_COLORS[platform] }}>
              {PLATFORM_ICONS[platform]} {gate.name}
            </div>
            {gate.requirements.map((r, i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 3 }}>
                🔒 {r.label}
              </div>
            ))}
            <div style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              {gate.tips.map((tip, i) => (
                <div key={i} style={{ fontSize: 11, color: 'var(--text)', marginBottom: 4 }}>
                  💡 {tip}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Schedule() {
  const [posts, setPosts]           = useState([])
  const [optimalTimes, setOptimalTimes] = useState(null)
  const [monetization, setMonetization] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addDate, setAddDate]       = useState(null)
  const [activeTab, setActiveTab]   = useState('calendar') // calendar | list | monetize
  const [weekOffset, setWeekOffset] = useState(0)

  // New post form state
  const [form, setForm] = useState({
    platform: 'instagram',
    content_type: 'reel',
    caption: '',
    scheduled_at: '',
    status: 'planned',
    notes: '',
  })

  useEffect(() => {
    Promise.all([
      api.getSchedule(),
      api.getOptimalTimes(),
    ]).then(([postsData, timesData]) => {
      setPosts(postsData)
      setOptimalTimes(timesData.times)
      setMonetization(timesData.monetization)
    }).finally(() => setLoading(false))
  }, [])

  function openAdd(date) {
    const d = new Date(date)
    d.setHours(10, 0, 0, 0)
    setForm(f => ({
      ...f,
      scheduled_at: d.toISOString().slice(0, 16),
    }))
    setAddDate(date)
    setShowAddModal(true)
  }

  async function savePost() {
    try {
      const saved = await api.addSchedulePost(form)
      setPosts(prev => [...prev, saved].sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at)))
      setShowAddModal(false)
    } catch (err) {
      alert(err.message)
    }
  }

  async function deletePost(id) {
    await api.deleteSchedulePost(id)
    setPosts(prev => prev.filter(p => p.id !== id))
    setSelectedPost(null)
  }

  async function updatePostStatus(id, status) {
    const updated = await api.updateSchedulePost(id, { status })
    setPosts(prev => prev.map(p => p.id === id ? updated : p))
    setSelectedPost(updated)
  }

  async function generateSchedule() {
    setGenerating(true)
    try {
      const platforms = ['instagram', 'tiktok']
      const res = await api.generateSchedule({ platforms, weeks: 4 })
      const fresh = await api.getSchedule()
      setPosts(fresh)
      alert(`✅ Generated ${res.generated} scheduled posts across 4 weeks!`)
    } catch (err) {
      alert(err.message)
    } finally {
      setGenerating(false)
    }
  }

  // Posts for current visible week
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + weekOffset * 7)
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)

  const weekPosts = posts.filter(p => {
    const d = new Date(p.scheduled_at)
    return d >= weekStart && d < weekEnd
  })

  const upcomingPosts = posts
    .filter(p => new Date(p.scheduled_at) >= new Date())
    .slice(0, 20)

  if (loading) return <div style={{ padding: '40px 32px', color: 'var(--text-dim)' }}>Loading schedule...</div>

  return (
    <div style={{ padding: '32px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>📅 Content Calendar</h1>
          <p style={{ color: 'var(--text-dim)', marginTop: 6, fontSize: 14 }}>
            Monetization-optimized posting schedule · {posts.length} posts planned
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => openAdd(new Date())}>+ Add Post</button>
          <button
            className="btn btn-sm"
            onClick={generateSchedule}
            disabled={generating}
            style={{ background: 'var(--accent-golden)', color: '#000', border: 'none', fontWeight: 700 }}
          >
            {generating ? 'Generating...' : '⚡ Auto-Generate 4 Weeks'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {[
          { key: 'calendar', label: '📅 Week View' },
          { key: 'list', label: '📋 All Posts' },
          { key: 'monetize', label: '💰 Monetization Guide' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '10px 16px', fontSize: 13, fontWeight: 600,
              color: activeTab === tab.key ? '#E1306C' : 'var(--text-dim)',
              borderBottom: activeTab === tab.key ? '2px solid #E1306C' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'calendar' && (
        <>
          {/* Week navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setWeekOffset(w => w - 1)}>← Prev</button>
            <div style={{ fontWeight: 600, fontSize: 14 }}>
              Week of {weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              {weekOffset === 0 && <span style={{ color: '#E1306C', marginLeft: 8, fontSize: 12 }}>← This week</span>}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setWeekOffset(w => w + 1)}>Next →</button>
          </div>
          <WeekCalendar
            posts={weekPosts}
            onSelect={setSelectedPost}
            onAdd={openAdd}
          />
          {optimalTimes && <OptimalTimesPanel times={optimalTimes} />}
        </>
      )}

      {activeTab === 'list' && (
        <div>
          {upcomingPosts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
              No upcoming posts. Generate a schedule or add posts manually.
            </div>
          )}
          {upcomingPosts.map(post => (
            <div
              key={post.id}
              onClick={() => setSelectedPost(post)}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '14px 18px',
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 8,
                background: PLATFORM_COLORS[post.platform],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
              }}>
                {PLATFORM_ICONS[post.platform]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {post.platform} · {post.content_type}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                  {new Date(post.scheduled_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                  {' '}{new Date(post.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </div>
                {post.notes && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>💡 {post.notes}</div>}
              </div>
              <StatusBadge status={post.status} />
            </div>
          ))}
        </div>
      )}

      {activeTab === 'monetize' && monetization && (
        <MonetizationGates gates={monetization} />
      )}

      {/* Selected post drawer */}
      {selectedPost && (
        <div style={{
          position: 'fixed', right: 0, top: 0, bottom: 0, width: 340,
          background: 'var(--bg)', borderLeft: '1px solid var(--border)',
          padding: '24px 20px', zIndex: 100, overflowY: 'auto',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Post Details</div>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-dim)' }} onClick={() => setSelectedPost(null)}>✕</button>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 24 }}>{PLATFORM_ICONS[selectedPost.platform]}</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginTop: 4 }}>
              {selectedPost.platform} {selectedPost.content_type}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
              {new Date(selectedPost.scheduled_at).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}
            </div>
          </div>

          <StatusBadge status={selectedPost.status} />

          {selectedPost.notes && (
            <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text-dim)', background: 'var(--surface)', padding: '10px 14px', borderRadius: 8 }}>
              💡 {selectedPost.notes}
            </div>
          )}

          {selectedPost.caption && (
            <div style={{ marginTop: 12, fontSize: 13, background: 'var(--surface)', padding: '10px 14px', borderRadius: 8 }}>
              {selectedPost.caption}
            </div>
          )}

          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 4 }}>Mark as:</div>
            {['planned', 'ready', 'posted', 'skipped'].map(s => (
              <button
                key={s}
                className={selectedPost.status === s ? 'btn btn-sm' : 'btn btn-secondary btn-sm'}
                onClick={() => updatePostStatus(selectedPost.id, s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <button
            style={{ marginTop: 16, width: '100%', background: 'none', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 8, padding: '8px 0', cursor: 'pointer', fontSize: 13 }}
            onClick={() => deletePost(selectedPost.id)}
          >
            Delete post
          </button>
        </div>
      )}

      {/* Add post modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }} onClick={() => setShowAddModal(false)}>
          <div
            style={{
              background: 'var(--bg)', borderRadius: 16, padding: '28px 28px',
              width: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>+ Add Scheduled Post</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Platform</label>
                <select
                  value={form.platform}
                  onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
                  className="input"
                >
                  {Object.keys(PLATFORM_COLORS).map(p => (
                    <option key={p} value={p}>{PLATFORM_ICONS[p]} {p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Content Type</label>
                <select
                  value={form.content_type}
                  onChange={e => setForm(f => ({ ...f, content_type: e.target.value }))}
                  className="input"
                >
                  {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
                  className="input"
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Caption / Notes</label>
                <textarea
                  value={form.caption}
                  onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
                  placeholder="What's this post about?"
                  className="input"
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="input"
                >
                  {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn" style={{ flex: 1 }} onClick={savePost}>Save Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
