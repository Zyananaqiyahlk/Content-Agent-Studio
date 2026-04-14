import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [credits, setCredits] = useState(0)
  const [tier, setTier] = useState('free')
  const [loading, setLoading] = useState(true)

  const loadMe = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }
    try {
      const data = await api.me()
      setUser(data.user)
      setCredits(data.credits)
      setTier(data.tier || 'free')
    } catch {
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadMe() }, [loadMe])

  async function login(email, password) {
    const data = await api.login({ email, password })
    localStorage.setItem('token', data.token)
    setUser(data.user)
    setCredits(data.credits)
    setTier(data.tier || 'free')
    return data
  }

  async function signup(body) {
    const data = await api.signup(body)
    localStorage.setItem('token', data.token)
    setUser(data.user)
    setCredits(data.credits)
    setTier('free')
    return data
  }

  function logout() {
    localStorage.removeItem('token')
    setUser(null)
    setCredits(0)
    setTier('free')
  }

  function refreshCredits() {
    api.getBalance().then(b => setCredits(b.balance)).catch(() => {})
  }

  return (
    <AuthContext.Provider value={{ user, credits, tier, loading, login, signup, logout, setUser, setCredits, refreshCredits }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
