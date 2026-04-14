import { useState, useRef, useEffect } from 'react'
import { api } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import ModelSelector from '../components/ModelSelector.jsx'
import InsufficientCreditsModal from '../components/InsufficientCreditsModal.jsx'

export default function Chat() {
  const { user, credits, refreshCredits } = useAuth()
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: `Hi ${user?.name?.split(' ')[0] || 'there'}! I'm your AI content agent for **${user?.brandName || 'your brand'}**. Ask me anything about growing your ${user?.niche || 'content'} brand — scripts, hooks, strategy, outreach, hashtags, trends. What do you need?`,
    }
  ])
  const [input, setInput] = useState('')
  const [model, setModel] = useState(user?.preferredModel || 'claude-sonnet-4-20250514')
  const [provider, setProvider] = useState(user?.aiProvider || 'anthropic')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [creditError, setCreditError] = useState(null)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const msg = input.trim()
    if (!msg || loading) return
    setInput('')

    const userMsg = { role: 'user', content: msg }
    const history = messages.filter(m => m.role !== 'ai' || messages.indexOf(m) > 0)
      .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }))

    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await api.chat({ message: msg, model, provider, history })
      const aiMsg = { role: 'ai', content: res.response }
      setMessages(prev => [...prev, aiMsg])
      refreshCredits()
      if (ttsEnabled) speak(res.response)
    } catch (err) {
      if (err.status === 402) {
        setCreditError({ balance: err.balance, needed: err.needed })
        setMessages(prev => prev.slice(0, -1))
        setInput(msg)
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: `Error: ${err.message}` }])
      }
    } finally {
      setLoading(false)
    }
  }

  function speak(text) {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const stripped = text.replace(/\*\*/g, '').replace(/#{1,6}\s/g, '').replace(/`/g, '')
    const utter = new SpeechSynthesisUtterance(stripped.slice(0, 500))
    utter.rate = 1.05
    utter.pitch = 1
    window.speechSynthesis.speak(utter)
  }

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Voice input not supported in this browser'); return }

    const rec = new SR()
    recognitionRef.current = rec
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.continuous = false

    rec.onresult = e => {
      const transcript = e.results[0][0].transcript
      setInput(prev => prev ? `${prev} ${transcript}` : transcript)
    }
    rec.onend = () => setRecording(false)
    rec.onerror = () => setRecording(false)

    rec.start()
    setRecording(true)
  }

  function stopVoice() {
    recognitionRef.current?.stop()
    setRecording(false)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <div>
      {creditError && (
        <InsufficientCreditsModal
          balance={creditError.balance}
          needed={creditError.needed}
          onClose={() => setCreditError(null)}
        />
      )}

      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <h1>AI Agent Brain</h1>
          <p>Your personal AI coach for brand growth. Costs 3 credits per message.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className={`btn btn-secondary btn-sm`}
            onClick={() => { setTtsEnabled(e => !e); window.speechSynthesis?.cancel() }}
            title="Toggle voice playback"
          >
            {ttsEnabled ? '🔊 Voice on' : '🔇 Voice off'}
          </button>
          <span className="badge">⚡ {credits} credits</span>
        </div>
      </div>

      {/* Model selector in a horizontal row */}
      <div className="card card-sm" style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <ModelSelector
            value={model}
            defaultProvider={provider}
            defaultModel={model}
            onChange={({ model: m, provider: p }) => { setModel(m); setProvider(p) }}
          />
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            window.speechSynthesis?.cancel()
            setMessages([{
              role: 'ai',
              content: `Hi ${user?.name?.split(' ')[0] || 'there'}! New conversation started. What can I help you with?`,
            }])
          }}
        >
          Clear chat
        </button>
      </div>

      <div className="chat-shell">
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg ${m.role}`}>
              <div className={`chat-avatar ${m.role === 'ai' ? 'ai' : 'user-av'}`}>
                {m.role === 'ai' ? '🤖' : initials}
              </div>
              <div className="chat-bubble">
                {formatMessage(m.content)}
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat-msg ai">
              <div className="chat-avatar ai">🤖</div>
              <div className="chat-bubble" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className="spinner" style={{ borderColor: 'rgba(255,255,255,.2)', borderTopColor: 'var(--accent)' }} />
                <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-row">
          <div className="chat-input-wrap">
            <textarea
              ref={textareaRef}
              placeholder="Ask anything… (Enter to send, Shift+Enter for new line)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={2}
            />
            <button
              className={`voice-btn${recording ? ' recording' : ''}`}
              onClick={recording ? stopVoice : startVoice}
              title={recording ? 'Stop recording' : 'Voice input'}
              type="button"
            >
              {recording ? '⏹' : '🎤'}
            </button>
          </div>
          <button
            className="btn btn-primary"
            onClick={send}
            disabled={loading || !input.trim()}
            style={{ height: 'fit-content', alignSelf: 'flex-end', padding: '13px 20px' }}
          >
            {loading ? <span className="spinner" /> : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Very light markdown formatter (bold + newlines)
function formatMessage(text) {
  if (!text) return null
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return <strong key={i}>{p.slice(2, -2)}</strong>
    }
    return p.split('\n').map((line, j, arr) => (
      <span key={`${i}-${j}`}>{line}{j < arr.length - 1 ? <br /> : ''}</span>
    ))
  })
}
