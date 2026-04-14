import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) { navigate('/dashboard'); return null }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed')
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

        <h1>Welcome back</h1>
        <p className="subtitle">Sign in to your account to continue</p>

        {error && <div className="alert error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-dim)' }}>
          Don't have an account?{' '}
          <Link to="/signup">Create one free</Link>
        </p>
      </div>
    </div>
  )
}
