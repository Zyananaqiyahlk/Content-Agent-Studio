import React, { useState, useRef, useEffect } from 'react'
import { Send, Mic, MicOff, Volume2, VolumeX, Trash2, ExternalLink } from 'lucide-react'
import { useStore } from '../store'
import { callClaude, speak, stopSpeaking, startListening } from '../agents/brain'

const QUICK_PROMPTS = [
  'Give me a viral hook idea',
  'Analyze my growth strategy',
  'Write a brand pitch template',
  'What should I post today?',
  'How do I get to 10K faster?',
  'Write my Day 8 script outline',
  'Best time to post on TikTok?',
  'Ideas for my next collaboration',
]

const LEARNING_PROMPT = (messages) => `Analyze this conversation and extract 1-2 learnable insights about Zyana's content strategy, tone, audience, or what's working.
Return ONLY a JSON array: [{"insight": "...", "category": "content|engagement|outreach|tone"}]
If no clear learnings: return []
Conversation:
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}`

export default function AgentChat() {
  const { apiKey, chatHistory, addMessage, clearChat, addLearning, learnings, audioEnabled, setAudioEnabled } = useStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [recognition, setRecognition] = useState(null)
  const [insightBanner, setInsightBanner] = useState('')
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    addMessage({ role: 'user', content: msg })
    setLoading(true)

    const history = chatHistory.map(m => ({ role: m.role, content: m.content }))
    const response = await callClaude(msg, apiKey, history)
    addMessage({ role: 'assistant', content: response })
    setLoading(false)

    if (audioEnabled) {
      speak(response, () => {}, () => {})
    }

    // Active learning every 4 messages
    const newCount = chatHistory.length + 2
    if (newCount > 0 && newCount % 4 === 0) {
      const last4 = [...chatHistory.slice(-3), { role: 'user', content: msg }, { role: 'assistant', content: response }]
      try {
        const learningResult = await callClaude(LEARNING_PROMPT(last4), apiKey)
        const jsonMatch = learningResult.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          const insights = JSON.parse(jsonMatch[0])
          insights.forEach(i => { if (i.insight) addLearning(i) })
          if (insights.length > 0) {
            setInsightBanner(insights[0].insight)
            setTimeout(() => setInsightBanner(''), 5000)
          }
        }
      } catch {}
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const handleMic = () => {
    if (listening) { recognition?.stop(); setListening(false); setRecognition(null); return }
    const r = startListening(
      (text) => { setInput(text); setListening(false); setRecognition(null) },
      () => { setListening(false); setRecognition(null) }
    )
    if (r) { setRecognition(r); setListening(true) }
  }

  const formatTime = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col h-full fade-in-up" style={{ height: 'calc(100vh - 3.5rem - 3rem)' }}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
            <span className="text-black font-syne font-bold text-xs">Z</span>
          </div>
          <span className="font-syne font-semibold text-white text-sm">Zyana Content Agent</span>
          {loading && <div className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse" />}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setAudioEnabled(!audioEnabled); if (audioEnabled) stopSpeaking() }}
            className={`p-2 rounded-xl transition-all ${audioEnabled ? 'bg-gold-500/15 text-gold-500' : 'text-zinc-600 hover:text-zinc-400'}`}>
            {audioEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
          {chatHistory.length > 0 && (
            <button onClick={clearChat} className="p-2 rounded-xl text-zinc-600 hover:text-red-400 transition-colors">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Insight banner */}
      {insightBanner && (
        <div className="mb-3 flex-shrink-0 bg-gold-500/10 border border-gold-500/30 rounded-xl px-4 py-2 slide-in">
          <p className="text-xs text-gold-500 font-dm">Insight captured: {insightBanner}</p>
        </div>
      )}

      {/* Learnings row */}
      {learnings.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mb-3 flex-shrink-0">
          {learnings.slice(0, 4).map(l => (
            <span key={l.id} className="flex-shrink-0 text-[10px] font-dm text-gold-500 bg-gold-500/10 border border-gold-500/20 px-2.5 py-1 rounded-full whitespace-nowrap">
              {l.insight.slice(0, 60)}...
            </span>
          ))}
        </div>
      )}

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mb-4">
              <span className="text-black font-syne font-bold text-xl">Z</span>
            </div>
            <h3 className="font-syne font-bold text-white text-xl mb-1">Zyana Content Agent</h3>
            <p className="text-sm text-zinc-500 font-dm mb-6">Your AI brand strategist is ready.</p>
            <div className="grid grid-cols-4 gap-2 max-w-xl">
              {QUICK_PROMPTS.map(p => (
                <button key={p} onClick={() => send(p)}
                  className="text-xs border border-white/10 text-zinc-400 px-3 py-2 rounded-xl hover:text-white hover:border-gold-500/30 transition-all font-dm text-left leading-tight">
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} slide-in`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                    <span className="text-black font-syne font-bold text-[10px]">Z</span>
                  </div>
                )}
                <div className={`max-w-[75%] ${msg.role === 'user'
                  ? 'bg-gold-500/10 border border-gold-500/20 rounded-2xl rounded-br-sm'
                  : 'bg-zinc-900 border border-white/5 rounded-2xl rounded-bl-sm'} px-4 py-3`}>
                  <p className="text-sm text-white font-dm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <p className="text-[10px] text-zinc-600 font-dm mt-1.5">{formatTime(msg.timestamp)}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mr-2 flex-shrink-0">
                  <span className="text-black font-syne font-bold text-[10px]">Z</span>
                </div>
                <div className="bg-zinc-900 border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Browser shortcuts */}
      <div className="flex gap-2 mt-3 flex-shrink-0">
        {[
          { label: 'Google Trends', url: 'https://trends.google.com' },
          { label: 'n8n Integrations', url: 'https://n8n.io/integrations' },
          { label: 'UGC Rates', url: 'https://www.google.com/search?q=ugc+creator+rates+2024' },
        ].map(({ label, url }) => (
          <a key={label} href={url} target="_blank" rel="noreferrer"
            className="flex items-center gap-1 text-[11px] border border-white/10 text-zinc-500 px-2.5 py-1 rounded-lg hover:text-white hover:border-white/20 transition-all font-dm">
            <ExternalLink size={10} /> {label}
          </a>
        ))}
      </div>

      {/* Input */}
      <div className="mt-2 flex items-end gap-2 flex-shrink-0">
        <div className="flex-1 bg-zinc-900 border border-white/10 rounded-2xl flex items-end gap-2 px-3 py-2 focus-within:border-gold-500/30 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask your content agent anything..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none font-dm resize-none max-h-24 py-1"
            style={{ lineHeight: '1.5' }}
          />
          <button onClick={handleMic}
            className={`p-1.5 rounded-xl transition-all flex-shrink-0 ${listening ? 'text-red-400 animate-pulse' : 'text-zinc-500 hover:text-gold-500'}`}>
            {listening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        </div>
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="bg-gradient-to-r from-gold-500 to-gold-600 text-black p-3 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-40 flex-shrink-0"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}