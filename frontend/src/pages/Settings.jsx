import { useState } from 'react'
import { api } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import ModelSelector from '../components/ModelSelector.jsx'

const NICHES = [
  'fitness', 'beauty', 'fashion', 'food', 'travel', 'tech', 'finance',
  'gaming', 'education', 'lifestyle', 'business', 'health', 'music',
  'parenting', 'sports', 'art', 'photography', 'motivation', 'comedy', 'other'
]

export default function Settings() {
  const { user, setUser } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    brandName: user?.brandName || '',
    niche: user?.niche || 'lifestyle',
    preferredModel: user?.preferredModel || 'claude-sonnet-4-20250514',
    aiProvider: user?.aiProvider || 'anthropic',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  function set(field) { return e => setForm(f => ({ ...f, [field]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setSuccess('')
    setError('')
    try {
      await api.updateProfile(form)
      setUser(u => ({ ...u, name: form.name, brandName: form.brandName, niche: form.niche, preferredModel: form.preferredModel, aiProvider: form.aiProvider }))
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your brand profile and AI preferences.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        <div className="card-header"><h2>Profile & Preferences</h2></div>

        {success && <div className="alert success">{success}</div>}
        {error && <div className="alert error">{error}</div>}

        <form className="settings-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input value={user?.email || ''} disabled style={{ opacity: .6 }} />
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Email cannot be changed</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Your name</label>
              <input value={form.name} onChange={set('name')} placeholder="Jane Smith" required />
            </div>
            <div className="form-group">
              <label>Brand name</label>
              <input value={form.brandName} onChange={set('brandName')} placeholder="Jane's Studio" />
            </div>
          </div>

          <div className="form-group">
            <label>Your niche</label>
            <select value={form.niche} onChange={set('niche')}>
              {NICHES.map(n => (
                <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>
              ))}
            </select>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              Used to personalize AI output for your content type
            </span>
          </div>

          <div className="divider" />

          <div>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Default AI model</div>
            <ModelSelector
              value={form.preferredModel}
              defaultProvider={form.aiProvider}
              defaultModel={form.preferredModel}
              onChange={({ model, provider }) => setForm(f => ({ ...f, preferredModel: model, aiProvider: provider }))}
            />
            <span style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6, display: 'block' }}>
              This model is pre-selected on all generation pages
            </span>
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Account info */}
      <div className="card" style={{ maxWidth: 560, marginTop: 0 }}>
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
