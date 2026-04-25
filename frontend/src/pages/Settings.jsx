import { useState, useEffect } from 'react'
import { api } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import ModelSelector from '../components/ModelSelector.jsx'

const NICHES = [
  'fitness', 'beauty', 'fashion', 'food', 'travel', 'tech', 'finance',
  'gaming', 'education', 'lifestyle', 'business', 'health', 'music',
  'parenting', 'sports', 'art', 'photography', 'motivation', 'comedy', 'other',
]

const VOICES = ['professional', 'casual', 'inspirational', 'educational', 'entertaining', 'humorous', 'authentic']
const FREQUENCIES = ['daily', '3x per week', '5x per week', 'weekly']
const CONTENT_GOALS = ['grow followers', 'brand deals', 'sell courses', 'build community', 'drive website traffic', 'promote business']

const PLATFORM_META = {
  youtube:   { icon: '▶️', label: 'YouTube',      placeholder: '@YourChannel',   desc: 'Live subscriber count via YouTube API' },
  instagram: { icon: '📸', label: 'Instagram',    placeholder: '@yourhandle',    desc: 'Handle saved · metrics coming soon'    },
  tiktok:    { icon: '🎵', label: 'TikTok',       placeholder: '@yourhandle',    desc: 'Handle saved · metrics coming soon'    },
  linkedin:  { icon: '💼', label: 'LinkedIn',     placeholder: 'yourname',       desc: 'Handle saved · metrics coming soon'    },
  twitter:   { icon: '𝕏',  label: 'X / Twitter',  placeholder: '@yourhandle',    desc: 'Handle saved · metrics coming soon'    },
}

export default function Settings() {
  const { user, setUser } = useAuth()

  // Profile
  const [profile, setProfile] = useState({
    name:           user?.name || '',
    brandName:      user?.brandName || '',
    niche:          user?.niche || 'lifestyle',
    bio:            user?.bio || '',
    preferredModel: user?.preferredModel || 'claude-sonnet-4-20250514',
    aiProvider:     user?.aiProvider || 'anthropic',
  })

  // Brand DNA
  const [brand, setBrand] = useState({
    voice:            user?.brandPreferences?.voice || '',
    audience:         user?.brandPreferences?.audience || '',
    postingFrequency: user?.brandPreferences?.postingFrequency || '',
    contentGoals:     user?.brandPreferences?.contentGoals || [],
    pillars:          user?.brandPreferences?.pillars || [],
  })
  const [pillarInput, setPillarInput] = useState('')

  // Platforms
  const [platforms, setPlatforms] = useState({
    youtube: '', instagram: '', tiktok: '', linkedin: '', twitter: '',
  })
  const [platformsSaved, setPlatformsSaved] = useState(false)

  const [loading, setLoading]             = useState(false)
  const [success, setSuccess]             = useState('')
  const [error, setError]                 = useState('')
  const [syncingYT, setSyncingYT]         = useState(false)
  const [ytMetrics, setYtMetrics]         = useState(null)

  useEffect(() => {
    api.getPlatforms().then(rows => {
      const map = Object.fromEntries(rows.map(r => [r.platform, r.handle || '']))
      setPlatforms(prev => ({ ...prev, ...map }))
      const yt = rows.find(r => r.platform === 'youtube')
      if (yt?.metrics?.subscribers) setYtMetrics(yt.metrics)
    }).catch(() => {})
  }, [])

  function set(field) { return e => setProfile(f => ({ ...f, [field]: e.target.value })) }
  function setBrandField(field) { return e => setBrand(b => ({ ...b, [field]: e.target.value })) }

  function toggleGoal(g) {
    setBrand(b => ({
      ...b,
      contentGoals: b.contentGoals.includes(g)
        ? b.contentGoals.filter(x => x !== g)
        : [...b.contentGoals, g],
    }))
  }

  function addPillar() {
    const v = pillarInput.trim()
    if (v && !brand.pillars.includes(v)) {
      setBrand(b => ({ ...b, pillars: [...b.pillars, v] }))
    }
    setPillarInput('')
  }

  function removePillar(p) {
    setBrand(b => ({ ...b, pillars: b.pillars.filter(x => x !== p) }))
  }

  async function saveProfile(e) {
    e.preventDefault()
    setLoading(true); setSuccess(''); setError('')
    try {
      const res = await api.updateProfile({
        ...profile,
        brandPreferences: brand,
      })
      setUser(u => ({ ...u, ...profile, brandPreferences: brand, bio: profile.bio }))
      setSuccess('Profile & brand DNA saved!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  async function savePlatforms() {
    try {
      await api.savePlatforms(
        Object.entries(platforms).map(([platform, handle]) => ({ platform, handle }))
      )
      setPlatformsSaved(true)
      setTimeout(() => setPlatformsSaved(false), 2500)
    } catch (err) {
      setError(err.message || 'Failed to save platforms')
    }
  }

  async function syncYouTube() {
    setSyncingYT(true)
    try {
      const metrics = await api.syncYouTube()
      setYtMetrics(metrics)
    } catch (err) {
      setError(err.message || 'YouTube sync failed — check your handle and YOUTUBE_API_KEY')
    } finally {
      setSyncingYT(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your profile, brand DNA, platform connections, and AI preferences.</p>
        </div>
      </div>

      {success && <div className="alert success">{success}</div>}
      {error   && <div className="alert error">{error}</div>}

      {/* ─── Profile + Brand DNA ─────────────────────────── */}
      <div className="settings-grid">
        <form className="card settings-form" onSubmit={saveProfile}>
          <div className="card-header"><h2>Profile</h2></div>

          <div className="form-group">
            <label>Email</label>
            <input value={user?.email || ''} disabled style={{ opacity: .6 }} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Your name</label>
              <input value={profile.name} onChange={set('name')} placeholder="Jane Smith" required />
            </div>
            <div className="form-group">
              <label>Brand name</label>
              <input value={profile.brandName} onChange={set('brandName')} placeholder="Jane's Studio" />
            </div>
          </div>

          <div className="form-group">
            <label>Your niche</label>
            <select value={profile.niche} onChange={set('niche')}>
              {NICHES.map(n => <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Bio <span style={{ fontWeight: 400, color: 'var(--text-dim)' }}>— shown on dashboard, used in AI prompts</span></label>
            <textarea
              value={profile.bio}
              onChange={set('bio')}
              placeholder="Fitness coach helping women over 30 build strength without spending hours in the gym…"
              rows={3}
            />
          </div>

          <div className="divider" />
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Default AI model</div>
          <ModelSelector
            value={profile.preferredModel}
            defaultProvider={profile.aiProvider}
            defaultModel={profile.preferredModel}
            onChange={({ model, provider }) => setProfile(f => ({ ...f, preferredModel: model, aiProvider: provider }))}
          />

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Save profile'}
          </button>
        </form>

        {/* Brand DNA */}
        <div className="card">
          <div className="card-header">
            <h2>🧬 Brand DNA</h2>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Used in every AI generation</span>
          </div>

          <div className="form-group">
            <label>Brand voice</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {VOICES.map(v => (
                <button
                  key={v} type="button"
                  className={`pill-btn${brand.voice === v ? ' active' : ''}`}
                  onClick={() => setBrand(b => ({ ...b, voice: v }))}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Target audience</label>
            <input
              value={brand.audience}
              onChange={setBrandField('audience')}
              placeholder="Women aged 25–40 interested in sustainable fitness"
            />
          </div>

          <div className="form-group">
            <label>Content pillars</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                value={pillarInput}
                onChange={e => setPillarInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPillar())}
                placeholder="e.g. Workout tips"
                style={{ flex: 1 }}
              />
              <button type="button" className="btn btn-secondary btn-sm" onClick={addPillar}>Add</button>
            </div>
            {brand.pillars.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {brand.pillars.map(p => (
                  <span key={p} className="pillar-chip">
                    {p}
                    <button type="button" onClick={() => removePillar(p)}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Posting frequency</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {FREQUENCIES.map(f => (
                <button
                  key={f} type="button"
                  className={`pill-btn${brand.postingFrequency === f ? ' active' : ''}`}
                  onClick={() => setBrand(b => ({ ...b, postingFrequency: f }))}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Content goals <span style={{ fontWeight: 400, color: 'var(--text-dim)' }}>(select all that apply)</span></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CONTENT_GOALS.map(g => (
                <button
                  key={g} type="button"
                  className={`pill-btn${brand.contentGoals.includes(g) ? ' active' : ''}`}
                  onClick={() => toggleGoal(g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" type="button" onClick={saveProfile} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Save Brand DNA'}
          </button>
        </div>
      </div>

      {/* ─── Connected platforms ─────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <h2>📡 Connected Platforms</h2>
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Handles used to personalise AI content & pull metrics</span>
        </div>

        <div className="platforms-grid">
          {Object.entries(PLATFORM_META).map(([key, meta]) => (
            <div key={key} className={`platform-connect-card${platforms[key] ? ' connected' : ''}`}>
              <div className="pcc-header">
                <span className="pcc-icon">{meta.icon}</span>
                <span className="pcc-name">{meta.label}</span>
                {platforms[key] && <span className="badge badge-sage" style={{ marginLeft: 'auto' }}>Saved</span>}
              </div>
              <input
                value={platforms[key] || ''}
                onChange={e => setPlatforms(p => ({ ...p, [key]: e.target.value }))}
                placeholder={meta.placeholder}
              />
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{meta.desc}</div>

              {key === 'youtube' && platforms.youtube && (
                <div style={{ marginTop: 8 }}>
                  {ytMetrics ? (
                    <div className="yt-metrics">
                      <span>▶️ <strong>{ytMetrics.subscribers?.toLocaleString()}</strong> subscribers</span>
                      <span>👁 <strong>{Number(ytMetrics.views)?.toLocaleString()}</strong> views</span>
                      <span>🎬 <strong>{ytMetrics.videos}</strong> videos</span>
                    </div>
                  ) : (
                    <button className="btn btn-ghost btn-sm" onClick={syncYouTube} disabled={syncingYT}>
                      {syncingYT ? <span className="spinner dark" /> : '🔄 Fetch YouTube metrics'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 4 }}>
          <button className="btn btn-primary" onClick={savePlatforms}>Save platforms</button>
          {platformsSaved && <span style={{ color: 'var(--sage-dark)', fontSize: 13 }}>✓ Saved</span>}
        </div>
      </div>

      {/* Account info */}
      <div className="card" style={{ maxWidth: 560 }}>
        <div className="card-header"><h3>Account info</h3></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-dim)' }}>User ID</span>
            <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{user?.id}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-dim)' }}>Email</span>
            <span>{user?.email}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-dim)' }}>Niche</span>
            <span style={{ textTransform: 'capitalize' }}>{user?.niche}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
