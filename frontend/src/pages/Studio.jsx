import { useState, useEffect, useRef } from 'react'
import { api } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'

const ASPECT_RATIOS = [
  { value: '9:16', label: '9:16 — Vertical (Reels / TikTok)' },
  { value: '16:9', label: '16:9 — Landscape (YouTube)'        },
  { value: '1:1',  label: '1:1  — Square (Instagram)'         },
]

const BG_OPTIONS = [
  { type: 'color', value: '#F7F5F0', label: 'Off-white'  },
  { type: 'color', value: '#2D3B2D', label: 'Forest'     },
  { type: 'color', value: '#FFFFFF', label: 'White'      },
  { type: 'color', value: '#1E1E2E', label: 'Dark'       },
]

const POLL_INTERVAL = 4000  // 4 seconds

function StatusPill({ status }) {
  const map = {
    processing: { label: 'Processing…', cls: 'badge-golden' },
    pending:    { label: 'Pending',      cls: 'badge-golden' },
    completed:  { label: 'Ready ✓',     cls: 'badge-sage'   },
    failed:     { label: 'Failed',       cls: 'badge-coral'  },
  }
  const { label, cls } = map[status] || { label: status, cls: 'badge-grey' }
  return <span className={`badge ${cls}`}>{label}</span>
}

export default function Studio() {
  const { user } = useAuth()

  const [avatars,    setAvatars]    = useState([])
  const [voices,     setVoices]     = useState([])
  const [configured, setConfigured] = useState(true)

  const [script,      setScript]      = useState('')
  const [avatarId,    setAvatarId]    = useState('')
  const [voiceId,     setVoiceId]     = useState('')
  const [aspectRatio, setAspectRatio] = useState('9:16')
  const [bg,          setBg]          = useState(BG_OPTIONS[0])
  const [testMode,    setTestMode]    = useState(true)

  const [generating, setGenerating] = useState(false)
  const [error,      setError]      = useState('')
  const [videos,     setVideos]     = useState([])
  const [polling,    setPolling]    = useState({})  // videoId → boolean

  const pollTimers = useRef({})

  useEffect(() => {
    api.getStudioAvatars().then(d => {
      setAvatars(d.avatars || [])
      setConfigured(d.configured !== false)
      if (d.avatars?.length) setAvatarId(d.avatars[0].avatar_id)
    }).catch(() => setConfigured(false))

    api.getStudioVoices().then(d => {
      setVoices(d.voices || [])
      if (d.voices?.length) setVoiceId(d.voices[0].voice_id)
    }).catch(() => {})

    api.getStudioVideos().then(setVideos).catch(() => {})

    return () => Object.values(pollTimers.current).forEach(clearInterval)
  }, [])

  function startPolling(videoId) {
    if (pollTimers.current[videoId]) return
    setPolling(p => ({ ...p, [videoId]: true }))

    pollTimers.current[videoId] = setInterval(async () => {
      try {
        const status = await api.getVideoStatus(videoId)
        setVideos(prev => prev.map(v => v.video_id === videoId ? { ...v, ...status, status: status.status } : v))

        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(pollTimers.current[videoId])
          delete pollTimers.current[videoId]
          setPolling(p => { const n = { ...p }; delete n[videoId]; return n })
        }
      } catch {
        clearInterval(pollTimers.current[videoId])
      }
    }, POLL_INTERVAL)
  }

  async function generate() {
    if (!script.trim()) { setError('Enter a script first'); return }
    setGenerating(true); setError('')

    try {
      const res = await api.generateVideo({
        script, avatarId, voiceId, aspectRatio,
        backgroundType:  bg.type,
        backgroundValue: bg.value,
        testMode,
      })

      const newVideo = {
        video_id:       res.videoId,
        status:         'processing',
        script_preview: script.slice(0, 150),
        created_at:     new Date().toISOString(),
      }
      setVideos(prev => [newVideo, ...prev])
      startPolling(res.videoId)
    } catch (err) {
      setError(err.message || 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  // Start polling for any existing videos still processing
  useEffect(() => {
    videos.filter(v => v.status === 'processing' || v.status === 'pending')
          .forEach(v => startPolling(v.video_id))
  }, [videos.length]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>🎥 AI Video Studio</h1>
          <p>Generate avatar videos from your scripts using HeyGen.</p>
        </div>
      </div>

      {!configured && (
        <div className="alert info" style={{ marginBottom: 0 }}>
          <strong>HeyGen not configured.</strong> Add <code>HEYGEN_API_KEY</code> to your backend <code>.env</code> to enable video generation.
          {' '}<a href="https://app.heygen.com/settings?nav=API" target="_blank" rel="noreferrer">Get API key →</a>
        </div>
      )}

      {error && <div className="alert error">{error}</div>}

      <div className="studio-layout">

        {/* ── Generator panel ─────────────────────────── */}
        <div className="card studio-panel">
          <div className="card-header"><h2>Generate video</h2></div>

          <div className="form-group">
            <label>Script <span style={{ fontWeight: 400, color: 'var(--text-dim)' }}>— what the avatar will say</span></label>
            <textarea
              value={script}
              onChange={e => setScript(e.target.value)}
              placeholder="Hi everyone! Today I'm sharing my top 3 tips for growing your Instagram in 2025…"
              rows={6}
            />
            <span style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'right' }}>{script.length} chars</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Aspect ratio</label>
              <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)}>
                {ASPECT_RATIOS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Background</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {BG_OPTIONS.map(b => (
                  <button
                    key={b.value} type="button"
                    className={`bg-swatch${bg.value === b.value ? ' selected' : ''}`}
                    style={{ '--swatch': b.value }}
                    onClick={() => setBg(b)}
                    title={b.label}
                  />
                ))}
              </div>
            </div>
          </div>

          {avatars.length > 0 && (
            <div className="form-group">
              <label>Avatar</label>
              <div className="avatar-scroll">
                {avatars.slice(0, 12).map(a => (
                  <button
                    key={a.avatar_id} type="button"
                    className={`avatar-chip${avatarId === a.avatar_id ? ' selected' : ''}`}
                    onClick={() => setAvatarId(a.avatar_id)}
                  >
                    {a.avatar_name || a.avatar_id.slice(0, 10)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {voices.length > 0 && (
            <div className="form-group">
              <label>Voice</label>
              <select value={voiceId} onChange={e => setVoiceId(e.target.value)}>
                {voices.slice(0, 30).map(v => (
                  <option key={v.voice_id} value={v.voice_id}>
                    {v.display_name || v.name} {v.language ? `· ${v.language}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-dim)' }}>
              <input
                type="checkbox"
                checked={testMode}
                onChange={e => setTestMode(e.target.checked)}
                style={{ width: 'auto' }}
              />
              Test mode (watermarked, free)
            </label>
          </div>

          <button
            className="btn btn-golden btn-lg btn-full"
            onClick={generate}
            disabled={generating || !configured}
          >
            {generating ? <><span className="spinner" /> Generating…</> : '🎬 Generate Video'}
          </button>
        </div>

        {/* ── Videos list ─────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 500 }}>Your Videos</h3>

          {videos.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="icon">🎬</div>
                <p>No videos yet. Generate your first one!</p>
              </div>
            </div>
          ) : (
            videos.map(v => (
              <div key={v.video_id || v.id} className="video-card">
                {v.thumbnail_url ? (
                  <img src={v.thumbnail_url} alt="thumbnail" className="video-thumb" />
                ) : (
                  <div className="video-thumb-placeholder">
                    {polling[v.video_id] ? <span className="spinner dark" /> : '🎬'}
                  </div>
                )}
                <div className="video-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <StatusPill status={v.status} />
                    {polling[v.video_id] && <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Checking…</span>}
                  </div>
                  <p className="video-script">{v.script_preview}</p>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6 }}>
                    {new Date(v.created_at).toLocaleString()}
                  </div>
                  {v.status === 'completed' && v.video_url && (
                    <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                      <a href={v.video_url} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                        ▶ Watch
                      </a>
                      <a href={v.video_url} download className="btn btn-secondary btn-sm">
                        ⬇ Download
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
