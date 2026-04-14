import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const NICHES = [
  'fitness', 'beauty', 'fashion', 'food', 'travel', 'tech', 'finance',
  'gaming', 'education', 'lifestyle', 'business', 'health', 'music',
  'parenting', 'sports', 'art', 'photography', 'motivation', 'comedy', 'other'
]

export default function Signup() {
  const { signup, user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', name: '', brandName: '', niche: 'lifestyle' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) { navigate('/dashboard'); return null }

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      const data = await signup(form)
      navigate('/dashboard', { state: { welcome: true, credits: data.credits } })
    } catch (err) {
      setError(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo">CA</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Content Agent Studio</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>AI-powered brand growth</div>
          </div>
        </div>

        <h1>Create your account</h1>
        <p className="subtitle">Get 25 free credits to start generating content</p>

        {error && <div className="alert error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Your name</label>
              <input placeholder="Jane Smith" value={form.name} onChange={set('name')} required />
            </div>
            <div className="form-group">
              <label>Brand name</label>
              <input placeholder="Jane's Studio" value={form.brandName} onChange={set('brandName')} />
            </div>
          </div>

          <div className="form-group">
            <label>Your niche</label>
            <select value={form.niche} onChange={set('niche')}>
              {NICHES.map(n => (
                <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="Min 8 characters" value={form.password} onChange={set('password')} required />
          </div>

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : '🚀 Create account — free'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-dim)' }}>
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
