import { useState } from 'react'
import { api } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import ModelSelector from '../components/ModelSelector.jsx'
import InsufficientCreditsModal from '../components/InsufficientCreditsModal.jsx'

const CATEGORIES = ['Technology', 'Fashion', 'Beauty', 'Fitness', 'Food & Beverage', 'Health & Wellness', 'Finance', 'Travel', 'Gaming', 'Education', 'Lifestyle', 'Sports', 'Automotive', 'Entertainment', 'Other']
const PIPELINE_KEY = 'outreach_pipeline'

function loadPipeline() {
  try { return JSON.parse(localStorage.getItem(PIPELINE_KEY)) || [] } catch { return [] }
}

function savePipeline(pipeline) {
  localStorage.setItem(PIPELINE_KEY, JSON.stringify(pipeline))
}

export default function Outreach() {
  const { user, credits, refreshCredits } = useAuth()
  const [tab, setTab] = useState('generate')
  const [form, setForm] = useState({
    brandName: '',
    brandCategory: 'Technology',
    brandNotes: '',
    model: user?.preferredModel || 'claude-sonnet-4-20250514',
    provider: user?.aiProvider || 'anthropic',
  })
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [creditError, setCreditError] = useState(null)
  const [pipeline, setPipeline] = useState(loadPipeline)
  const [copied, setCopied] = useState(false)

  function set(field) { return e => setForm(f => ({ ...f, [field]: e.target.value })) }

  async function generate(e) {
    e.preventDefault()
    setError('')
    setEmail('')
    setLoading(true)
    try {
      const res = await api.outreachEmail(form)
      setEmail(res.email)
      refreshCredits()

      // Add to pipeline
      const entry = {
        id: Date.now(),
        brandName: form.brandName,
        brandCategory: form.brandCategory,
        status: 'draft',
        email: res.email,
        createdAt: new Date().toISOString(),
      }
      const updated = [entry, ...pipeline]
      setPipeline(updated)
      savePipeline(updated)
    } catch (err) {
      if (err.status === 402) { setCreditError({ balance: err.balance, needed: err.needed }); return }
      setError(err.message || 'Email generation failed')
    } finally {
      setLoading(false)
    }
  }

  function copy() {
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function updateStatus(id, status) {
    const updated = pipeline.map(p => p.id === id ? { ...p, status } : p)
    setPipeline(updated)
    savePipeline(updated)
  }

  function removeBrand(id) {
    const updated = pipeline.filter(p => p.id !== id)
    setPipeline(updated)
    savePipeline(updated)
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
          <h1>Brand Outreach</h1>
          <p>Generate personalized UGC partnership emails. Costs 5 credits per email.</p>
        </div>
        <span className="badge">⚡ {credits} credits</span>
      </div>

      <div className="tabs">
        <button className={`tab${tab === 'generate' ? ' active' : ''}`} onClick={() => setTab('generate')}>Generate Email</button>
        <button className={`tab${tab === 'pipeline' ? ' active' : ''}`} onClick={() => setTab('pipeline')}>
          Pipeline ({pipeline.length})
        </button>
      </div>

      {tab === 'generate' && (
        <div style={{ display: 'grid', gridTemplateColumns: email ? '1fr 1fr' : '1fr', gap: 20 }}>
          <div className="card">
            <div className="card-header"><h3>🎯 Target brand</h3></div>
            <form className="script-form" onSubmit={generate}>
              <div className="form-group">
                <label>Brand name *</label>
                <input placeholder="e.g. Gymshark" value={form.brandName} onChange={set('brandName')} required />
              </div>

              <div className="form-group">
                <label>Brand category</label>
                <select value={form.brandCategory} onChange={set('brandCategory')}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Notes about this brand (optional)</label>
                <textarea
                  placeholder="e.g. They recently launched a sustainable line, I love their values around inclusivity..."
                  value={form.brandNotes}
                  onChange={set('brandNotes')}
                  rows={3}
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
                {loading ? <><span className="spinner" /> Writing email...</> : '✉️ Generate Outreach Email (5 credits)'}
              </button>
            </form>
          </div>

          {email && (
            <div className="card">
              <div className="card-header">
                <h3>✉️ Generated Email</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={copy}>
                    {copied ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="script-output" style={{ whiteSpace: 'pre-wrap', fontFamily: 'Inter, sans-serif', lineHeight: 1.8 }}>
                {email}
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-dim)' }}>
                Saved to pipeline as draft. Go to Pipeline tab to update status.
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'pipeline' && (
        <div className="card">
          <div className="card-header">
            <h3>📋 Brand pipeline</h3>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{pipeline.length} brands tracked</span>
          </div>
          {pipeline.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📧</div>
              <p>No brands in your pipeline yet. Generate your first outreach email!</p>
            </div>
          ) : (
            <div className="pipeline">
              {pipeline.map(item => (
                <div key={item.id} className="pipeline-item">
                  <div style={{ flex: 1 }}>
                    <div className="pipeline-brand">{item.brandName}</div>
                    <div className="pipeline-cat">{item.brandCategory} · {new Date(item.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select
                      value={item.status}
                      onChange={e => updateStatus(item.id, e.target.value)}
                      style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }}
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="replied">Replied</option>
                    </select>
                    <span className={`status-badge ${item.status}`}>{item.status}</span>
                    <button
                      className="btn-icon"
                      onClick={() => removeBrand(item.id)}
                      title="Remove"
                      style={{ fontSize: 14, color: 'var(--red)' }}
                    >
                      ✕
                    </button>
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
