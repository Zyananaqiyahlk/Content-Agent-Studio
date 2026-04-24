import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useNotif } from '../context/NotifContext.jsx'
import { api } from '../api.js'

const STEPS = ['welcome', 'expectations', 'goals', 'social', 'done']

const EXPECTATIONS = [
  { id: 'grow',    icon: '📈', label: 'Grow my audience',    desc: 'Get more followers fast' },
  { id: 'scripts', icon: '🎬', label: 'Create content',      desc: 'Scripts, ideas, captions' },
  { id: 'brand',   icon: '🤝', label: 'Land brand deals',    desc: 'UGC & sponsorships' },
  { id: 'agency',  icon: '🏢', label: 'Run an agency',       desc: 'Manage multiple clients' },
  { id: 'learn',   icon: '📚', label: 'Learn & improve',     desc: 'Level up my content skills' },
  { id: 'income',  icon: '💰', label: 'Generate income',     desc: 'Monetise my following' },
]

const SOCIAL_PLATFORMS = [
  { id: 'instagram', icon: '📸', name: 'Instagram',     desc: 'Reels, Stories, Posts',     color: '#E1306C' },
  { id: 'tiktok',    icon: '🎵', name: 'TikTok',        desc: 'Short videos & trends',     color: '#000' },
  { id: 'youtube',   icon: '▶️', name: 'YouTube',       desc: 'Long & short form videos',  color: '#FF0000' },
  { id: 'linkedin',  icon: '💼', name: 'LinkedIn',      desc: 'Professional content',      color: '#0077B5' },
  { id: 'twitter',   icon: '𝕏',  name: 'X / Twitter',   desc: 'Threads & conversations',   color: '#000' },
]

const GOALS = [
  { id: '1k',   label: '1K followers',  sub: 'Just starting out' },
  { id: '10k',  label: '10K followers', sub: 'Growing fast' },
  { id: '50k',  label: '50K followers', sub: 'Micro-influencer' },
  { id: '100k', label: '100K+',         sub: 'Major creator' },
]

export default function OnboardingModal({ onComplete }) {
  const { user, setUser } = useAuth()
  const { notify } = useNotif()
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState({
    expectations: [],
    goal: '',
    platforms: [],
    handles: {},
    contentFreq: '3-5x per week',
  })

  const current = STEPS[step]
  const totalSteps = STEPS.length - 1

  function toggleExpectation(id) {
    setSelected(s => ({
      ...s,
      expectations: s.expectations.includes(id)
        ? s.expectations.filter(e => e !== id)
        : [...s.expectations, id]
    }))
  }

  function togglePlatform(id) {
    setSelected(s => ({
      ...s,
      platforms: s.platforms.includes(id)
        ? s.platforms.filter(p => p !== id)
        : [...s.platforms, id]
    }))
  }

  function setHandle(platform, value) {
    setSelected(s => ({ ...s, handles: { ...s.handles, [platform]: value } }))
  }

  async function finish() {
    // Save to profile
    try {
      await api.updateProfile({
        name: user?.name,
        brandName: user?.brandName,
        niche: user?.niche,
        onboardingData: JSON.stringify(selected)
      })
    } catch (e) { /* non-blocking */ }

    localStorage.setItem('onboarded', 'true')
    localStorage.setItem('onboarding_data', JSON.stringify(selected))

    notify({
      title: '🎉 You\'re all set!',
      message: `Welcome ${user?.name?.split(' ')[0]}! Your agent is personalised and ready.`,
      type: 'sage',
      duration: 6000
    })

    onComplete(selected)
  }

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
  }
  function back() {
    if (step > 0) setStep(s => s - 1)
  }

  return (
    <div className="modal-overlay">
      <div className="modal">

        {/* Progress bar */}
        <div className="onboard-steps">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`onboard-step ${i < step ? 'done' : i === step ? 'current' : ''}`} />
          ))}
        </div>

        {/* ── STEP 0: Welcome ── */}
        {current === 'welcome' && (
          <div>
            <span className="onboard-emoji">👋</span>
            <div className="onboard-title">Welcome, {user?.name?.split(' ')[0]}!</div>
            <p className="onboard-sub">
              Let's spend 60 seconds personalising your AI agent so it knows exactly how to help you grow. The more you tell it, the smarter it gets.
            </p>
            <div style={{ background: 'var(--sage-dim)', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 24, fontSize: 14 }}>
              <strong>✨ 25 free credits</strong> are ready in your account — let's make sure they go to the right content.
            </div>
            <button className="btn btn-primary btn-full btn-lg" onClick={next}>
              Let's personalise my agent →
            </button>
          </div>
        )}

        {/* ── STEP 1: Expectations ── */}
        {current === 'expectations' && (
          <div>
            <span className="onboard-emoji">🎯</span>
            <div className="onboard-title">What do you want to achieve?</div>
            <p className="onboard-sub">Select everything that applies. Your agent will focus on what matters most to you.</p>
            <div className="expect-grid" style={{ marginBottom: 24 }}>
              {EXPECTATIONS.map(e => (
                <div
                  key={e.id}
                  className={`expect-card ${selected.expectations.includes(e.id) ? 'selected' : ''}`}
                  onClick={() => toggleExpectation(e.id)}
                >
                  <span className="expect-card-icon">{e.icon}</span>
                  <div className="expect-card-label">{e.label}</div>
                  <div className="expect-card-desc">{e.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={back}>← Back</button>
              <button className="btn btn-primary btn-full" onClick={next} disabled={selected.expectations.length === 0}>
                Continue ({selected.expectations.length} selected)
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Goals + Frequency ── */}
        {current === 'goals' && (
          <div>
            <span className="onboard-emoji">🚀</span>
            <div className="onboard-title">Set your growth target</div>
            <p className="onboard-sub">Where do you want to be in the next 90 days?</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {GOALS.map(g => (
                <div
                  key={g.id}
                  className={`expect-card ${selected.goal === g.id ? 'selected' : ''}`}
                  onClick={() => setSelected(s => ({ ...s, goal: g.id }))}
                >
                  <div className="expect-card-label" style={{ fontSize: 16 }}>{g.label}</div>
                  <div className="expect-card-desc">{g.sub}</div>
                </div>
              ))}
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label>How often do you post?</label>
              <select value={selected.contentFreq} onChange={e => setSelected(s => ({ ...s, contentFreq: e.target.value }))}>
                {['Daily', '3-5x per week', '1-2x per week', 'A few times a month'].map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={back}>← Back</button>
              <button className="btn btn-primary btn-full" onClick={next} disabled={!selected.goal}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Social connect ── */}
        {current === 'social' && (
          <div>
            <span className="onboard-emoji">📱</span>
            <div className="onboard-title">Connect your platforms</div>
            <p className="onboard-sub">
              Add your handles so the agent can track your growth, understand your niche, and give platform-specific advice.
            </p>
            <div className="social-connect-grid" style={{ marginBottom: 24 }}>
              {SOCIAL_PLATFORMS.map(p => (
                <div key={p.id} className={`social-connect-item ${selected.platforms.includes(p.id) ? 'connected' : ''}`}>
                  <span className="social-connect-icon">{p.icon}</span>
                  <div className="social-connect-info">
                    <div className="social-connect-name">{p.name}</div>
                    <div className="social-connect-desc">{p.desc}</div>
                  </div>
                  {selected.platforms.includes(p.id) ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        placeholder={`@handle`}
                        value={selected.handles[p.id] || ''}
                        onChange={e => setHandle(p.id, e.target.value)}
                        style={{ width: 120, padding: '5px 10px', fontSize: 12 }}
                        onClick={e => e.stopPropagation()}
                      />
                      <button className="btn btn-sm btn-coral" onClick={() => togglePlatform(p.id)}>✕</button>
                    </div>
                  ) : (
                    <button className="btn btn-sm btn-ghost social-connect-btn" onClick={() => togglePlatform(p.id)}>
                      + Add
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={back}>← Back</button>
              <button className="btn btn-primary btn-full" onClick={next}>
                {selected.platforms.length > 0 ? `Continue with ${selected.platforms.length} platform${selected.platforms.length > 1 ? 's' : ''}` : 'Skip for now →'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Done ── */}
        {current === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <span className="onboard-emoji" style={{ fontSize: 52 }}>🎉</span>
            <div className="onboard-title">Your agent is ready!</div>
            <p className="onboard-sub" style={{ marginBottom: 24 }}>
              Based on your answers, I've personalised your dashboard, daily tasks, and content strategy. Here's what's waiting for you:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, textAlign: 'left' }}>
              {selected.expectations.includes('grow') && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 14px', background: 'var(--sage-dim)', borderRadius: 'var(--radius)' }}>
                  <span>📈</span>
                  <div><strong>Growth plan</strong> — daily tasks to hit your {selected.goal} goal</div>
                </div>
              )}
              {selected.expectations.includes('scripts') && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 14px', background: 'var(--golden-dim)', borderRadius: 'var(--radius)' }}>
                  <span>🎬</span>
                  <div><strong>5 script ideas</strong> ready based on your niche</div>
                </div>
              )}
              {selected.expectations.includes('brand') && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 14px', background: 'var(--coral-dim)', borderRadius: 'var(--radius)' }}>
                  <span>🤝</span>
                  <div><strong>Brand outreach</strong> pipeline ready to activate</div>
                </div>
              )}
              {selected.platforms.length > 0 && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 14px', background: 'var(--sage-dim)', borderRadius: 'var(--radius)' }}>
                  <span>📱</span>
                  <div><strong>{selected.platforms.length} platform{selected.platforms.length > 1 ? 's' : ''} connected</strong> — agent will track your growth</div>
                </div>
              )}
            </div>

            <button className="btn btn-primary btn-full btn-lg" onClick={finish}>
              Go to my dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
