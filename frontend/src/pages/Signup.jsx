import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useNotif } from '../context/NotifContext.jsx'

const NICHES = [
  'fitness', 'beauty', 'fashion', 'food', 'travel', 'tech', 'finance',
  'gaming', 'education', 'lifestyle', 'business', 'health', 'music',
  'parenting', 'sports', 'art', 'photography', 'motivation', 'comedy', 'other'
]

export default function Signup() {
  const { signup, user } = useAuth()
  const { notify } = useNotif()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', name: '', brandName: '', niche: 'lifestyle' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) { navigate('/dashboard'); return null }

  function set(field) { return e => setForm(f => ({ ...f, [field]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      const data = await signup(form)
      // Clear onboarding flag so modal shows
      localStorage.removeItem('onboarded')
      navigate('/dashboard', { state: { welcome: true, credits: data.credits, showOnboarding: true } })
    } catch (err) {
      setError(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  function handleSocialAuth(provider) {
    notify({
      title: `${provider} sign-up coming soon`,
      message: 'Social auth is being configured. Create an account with email for now.',
      type: 'golden',
      duration: 4000
    })
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo">CA</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, fontFamily: 'Playfair Display, serif' }}>
              Content Agent Studio
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>AI-powered brand growth</div>
          </div>
        </div>

        <h1>Create your account</h1>
        <p className="subtitle">Get 25 free credits — no card required</p>

        {/* Social auth */}
        <div className="social-buttons">
          <button className="btn-social" onClick={() => handleSocialAuth('Google')}>
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </button>
          <button className="btn-social" onClick={() => handleSocialAuth('Apple')}>
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Sign up with Apple
          </button>
        </div>

        <div className="social-divider">or create account with email</div>

        {error && <div className="alert error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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

          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? <span className="spinner" /> : '🚀 Create free account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-dim)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
        </p>

        <p style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: 'var(--text-light)' }}>
          By signing up you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  )
}
