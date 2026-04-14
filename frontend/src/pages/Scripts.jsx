import { useState, useEffect } from 'react'
import { api } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import ModelSelector from '../components/ModelSelector.jsx'
import InsufficientCreditsModal from '../components/InsufficientCreditsModal.jsx'

const FORMATS = ['Talking Head', 'Vlog', 'Tutorial', 'POV', 'Storytime', 'Listicle', 'Day in the Life']
const PLATFORMS = ['Instagram Reels', 'TikTok', 'YouTube Shorts', 'LinkedIn', 'Twitter/X']

export default function Scripts() {
  const { user, credits, refreshCredits } = useAuth()
  const [tab, setTab] = useState('generate')
  const [form, setForm] = useState({
    topic: '',
    format: 'Talking Head',
    platform: 'Instagram Reels',
    audience: '',
    model: user?.preferredModel || 'claude-sonnet-4-20250514',
    provider: user?.aiProvider || 'anthropic',
  })
  const [script, setScript] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [creditError, setCreditError] = useState(null)
  const [scripts, setScripts] = useState([])
  const [selectedScript, setSelectedScript] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.getScripts().then(setScripts).catch(() => {})
  }, [])

  function set(field) { return e => setForm(f => ({ ...f, [field]: e.target.value })) }

  async function generate(e) {
    e.preventDefault()
    setError('')
    setScript('')
    setLoading(true)
    try {
      const res = await api.generateScript(form)
      setScript(res.script)
      refreshCredits()
      // Refresh script list
      api.getScripts().then(setScripts).catch(() => {})
    } catch (err) {
      if (err.status === 402) { setCreditError({ balance: err.balance, needed: err.needed }); return }
      setError(err.message || 'Script generation failed')
    } finally {
      setLoading(false)
    }
  }

  function copy(text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div>
      {creditError && (
        <InsufficientCreditsModal
          balance={creditError.balance}
          needed={creditError.needed}
          onClose={() => setCreditError(null)}
        />
      )}

      <div className="page-header">
        <div>
          <h1>Script Generator</h1>
          <p>Generate ready-to-film video scripts with AI. Costs 5 credits per script.</p>
        </div>
        <span className="badge">⚡ {credits} credits</span>
      </div>

      <div className="tabs">
        <button className={`tab${tab === 'generate' ? ' active' : ''}`} onClick={() => setTab('generate')}>Generate</button>
        <button className={`tab${tab === 'library' ? ' active' : ''}`} onClick={() => setTab('library')}>
          Library ({scripts.length})
        </button>
      </div>

      {tab === 'generate' && (
        <div style={{ display: 'grid', gridTemplateColumns: script ? '1fr 1fr' : '1fr', gap: 20 }}>
          <div className="card">
            <form className="script-form" onSubmit={generate}>
              <div className="form-group">
                <label>Topic / Hook idea *</label>
                <input
                  placeholder="e.g. '3 mistakes beginners make at the gym'"
                  value={form.topic}
                  onChange={set('topic')}
                  required
                  autoFocus
                />
              </div>

              <div className="script-options">
                <div className="form-group">
                  <label>Format</label>
                  <select value={form.format} onChange={set('format')}>
                    {FORMATS.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Platform</label>
                  <select value={form.platform} onChange={set('platform')}>
                    {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Target audience (optional)</label>
                <input
                  placeholder="e.g. 'women 25-35 interested in weight loss'"
                  value={form.audience}
                  onChange={set('audience')}
                />
              </div>

              <ModelSelector
                value={form.model}
                defaultProvider={form.provider}
                defaultModel={form.model}
                onChange={({ model, provider }) => setForm(f => ({ ...f, model, provider }))}
              />

              {error && <div className="alert error">{error}</div>}

              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? <><span className="spinner" /> Generating...</> : '🎬 Generate Script (5 credits)'}
              </button>
            </form>
          </div>

          {script && (
            <div className="card">
              <div className="card-header">
                <h3>📄 Generated Script</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => copy(script)}>
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
              <div className="script-output">{script}</div>
            </div>
          )}
        </div>
      )}

      {tab === 'library' && (
        <div className="card">
          {scripts.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🎬</div>
              <p>No scripts yet. Generate your first one!</p>
            </div>
          ) : selectedScript ? (
            <div>
              <div className="card-header">
                <div>
                  <h3>{selectedScript.topic}</h3>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
                    {selectedScript.format} · {selectedScript.platform} · {new Date(selectedScript.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => copy(selectedScript.content)}>
                    {copied ? '✓ Copied!' : 'Copy'}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setSelectedScript(null)}>← Back</button>
                </div>
              </div>
              <div className="script-output">{selectedScript.content}</div>
            </div>
          ) : (
            <div className="script-list">
              {scripts.map(s => (
                <div key={s.id} className="script-item" onClick={() => setSelectedScript(s)}>
                  <div className="topic">{s.topic}</div>
                  <div className="meta">
                    <span className="badge">{s.format || 'Talking Head'}</span>
                    <span>{s.platform}</span>
                    <span>{new Date(s.created_at).toLocaleDateString()}</span>
                    <span style={{ marginLeft: 'auto', color: 'var(--text-dim)' }}>View →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
