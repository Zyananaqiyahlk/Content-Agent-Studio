import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Credits() {
  const { credits, tier, refreshCredits } = useAuth()
  const location = useLocation()
  const [packages, setPackages] = useState([])
  const [history, setHistory] = useState([])
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState({})
  const [capturing, setCapturing] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [error, setError] = useState('')

  // Handle PayPal redirect back — capture the payment
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const payment = params.get('payment')
    const token = params.get('token')   // PayPal order ID

    if (payment === 'pending' && token) {
      setCapturing(true)
      api.capturePaypal(token)
        .then(res => {
          setSuccessMsg(`Payment confirmed! +${res.credits} credits added to your account.`)
          refreshCredits()
          reloadData()
        })
        .catch(err => setError(err.message || 'Payment capture failed. Contact support.'))
        .finally(() => {
          setCapturing(false)
          window.history.replaceState({}, '', '/credits')
        })
    }

    if (payment === 'cancelled') {
      setError('Payment was cancelled.')
      window.history.replaceState({}, '', '/credits')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function reloadData() {
    Promise.all([
      api.getBalance(),
      api.getBillingHistory(),
    ]).then(([bal, hist]) => {
      setBalance(bal)
      setHistory(hist)
    }).catch(() => {})
  }

  useEffect(() => {
    Promise.all([
      api.getPackages(),
      api.getBalance(),
      api.getBillingHistory(),
    ]).then(([pkgs, bal, hist]) => {
      setPackages(pkgs)
      setBalance(bal)
      setHistory(hist)
    }).catch(() => {})
  }, [])

  async function buy(pkg) {
    setLoading(l => ({ ...l, [pkg.id]: true }))
    setError('')
    try {
      const res = await api.createCheckout({ packageId: pkg.id })
      // Redirect to PayPal checkout
      if (res.url) window.location.href = res.url
    } catch (err) {
      setError(err.message || 'Checkout failed. Please try again.')
    } finally {
      setLoading(l => ({ ...l, [pkg.id]: false }))
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Credits & Billing</h1>
          <p>Buy credits to generate scripts, chat, and write outreach emails.</p>
        </div>
      </div>

      {capturing && (
        <div className="alert info">
          <span className="spinner" /> Confirming your payment with PayPal…
        </div>
      )}
      {successMsg && <div className="alert success">{successMsg}</div>}
      {error && <div className="alert error">{error}</div>}

      {/* Balance cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 8 }}>
        <div className="stat-card">
          <div className="label">Credit balance</div>
          <div className="value" style={{ color: 'var(--accent)' }}>{credits}</div>
          <div className="sub">Available now</div>
        </div>
        <div className="stat-card">
          <div className="label">Total used</div>
          <div className="value">{balance?.total_used ?? '—'}</div>
          <div className="sub">All time</div>
        </div>
        <div className="stat-card">
          <div className="label">Total purchased</div>
          <div className="value">{balance?.total_purchased ?? '—'}</div>
          <div className="sub">All time</div>
        </div>
        <div className="stat-card">
          <div className="label">Plan</div>
          <div className="value" style={{ fontSize: 22, textTransform: 'capitalize' }}>{tier || 'Free'}</div>
          <div className="sub">Current tier</div>
        </div>
      </div>

      {/* Credit cost reference */}
      <div className="card card-sm" style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 13, color: 'var(--text-dim)', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <span>🎬 Script: <strong>5 credits</strong></span>
          <span>🤖 Chat: <strong>3 credits</strong></span>
          <span>✉️ Email: <strong>5 credits</strong></span>
          <span>🎁 Signup bonus: <strong>25 free credits</strong></span>
        </div>
      </div>

      {/* Packages */}
      <div className="card">
        <div className="card-header">
          <h2>Buy credits</h2>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Secure checkout via PayPal</div>
        </div>
        {packages.length === 0 ? (
          <div className="empty-state"><div className="icon">💳</div><p>Loading packages…</p></div>
        ) : (
          <div className="package-grid">
            {packages.map(pkg => (
              <div key={pkg.id} className={`package-card${pkg.popular ? ' popular' : ''}`}>
                {pkg.popular && <div className="popular-tag">Most popular</div>}
                <div className="package-name">{pkg.name}</div>
                <div className="package-credits">{pkg.credits.toLocaleString()}</div>
                <div className="package-price">credits</div>
                <div style={{ fontWeight: 700, fontSize: 20 }}>${pkg.priceUsd}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  ${(pkg.priceUsd / pkg.credits * 100).toFixed(1)}¢ per credit
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => buy(pkg)}
                  disabled={loading[pkg.id] || capturing}
                >
                  {loading[pkg.id] ? <span className="spinner" /> : `Buy with PayPal`}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction history */}
      <div className="card">
        <div className="card-header"><h3>Transaction history</h3></div>
        {history.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🧾</div>
            <p>No transactions yet.</p>
          </div>
        ) : (
          <div className="history-list">
            {history.map((tx, i) => (
              <div key={i} className="history-item">
                <div>
                  <div style={{ fontWeight: 500, textTransform: 'capitalize' }}>{tx.type.replace(/_/g, ' ')}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                    {new Date(tx.created_at).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  {tx.amount_usd > 0 && <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>${tx.amount_usd}</span>}
                  {tx.credits_added > 0 && (
                    <span className="credits-added">+{tx.credits_added} credits</span>
                  )}
                  <span style={{
                    fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                    color: tx.status === 'completed' ? 'var(--green)' : tx.status === 'pending' ? 'var(--yellow)' : 'var(--red)'
                  }}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
