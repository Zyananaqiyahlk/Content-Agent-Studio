import React, { useState } from 'react'
import { Mic, MicOff, Wand2, Copy, Volume2, Download, RotateCcw, Save, Check, Loader2 } from 'lucide-react'
import { useStore } from '../store'
import { callClaude, speak, stopSpeaking, startListening } from '../agents/brain'

const FORMATS = ['Talking Head', 'Screen Recording', 'Case Study', 'Educational', 'Vlog']
const PLATFORMS = ['Instagram Reels', 'TikTok', 'YouTube Shorts', 'All Platforms', 'LinkedIn']
const AUDIENCES = ['Small business owners', 'Clinic owners', 'Real estate agents', 'Restaurant owners', 'Hotel managers', 'Founders']
const QUICK_PICKS = [
  'AI front desk for clinics',
  '3 tools that save 10hrs/week',
  'Hotel booking automation',
  'Real estate lead follow-up',
  'Restaurant review responses',
]

function parseScript(text) {
  const sections = {}
  const hookMatch = text.match(/\*\*HOOK[^*]*\*\*\n?([\s\S]*?)(?=\*\*BODY|\*\*CTA|\*\*PRODUCTION|$)/i)
  const bodyMatch = text.match(/\*\*BODY[^*]*\*\*\n?([\s\S]*?)(?=\*\*CTA|\*\*PRODUCTION|$)/i)
  const ctaMatch = text.match(/\*\*CTA[^*]*\*\*\n?([\s\S]*?)(?=\*\*PRODUCTION|$)/i)
  const prodMatch = text.match(/\*\*PRODUCTION NOTES\*\*\n?([\s\S]*?)$/i)
  if (hookMatch) sections.hook = hookMatch[1].trim()
  if (bodyMatch) sections.body = bodyMatch[1].trim()
  if (ctaMatch) sections.cta = ctaMatch[1].trim()
  if (prodMatch) sections.production = prodMatch[1].trim()
  return sections
}

export default function ScriptGenerator() {
  const { apiKey, addScript, generatedScripts, metrics } = useStore()
  const [format, setFormat] = useState('Talking Head')
  const [platform, setPlatform] = useState('Instagram Reels')
  const [audience, setAudience] = useState('Small business owners')
  const [topic, setTopic] = useState('')
  const [script, setScript] = useState('')
  const [parsed, setParsed] = useState(null)
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [copied, setCopied] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [saved, setSaved] = useState(false)
  const [recognition, setRecognition] = useState(null)

  const generate = async () => {
    if (!topic.trim()) return
    setLoading(true)
    setScript('')
    setParsed(null)
    const prompt = `Generate a complete ready-to-film ${format} script for Zyana Systems.
TOPIC: ${topic}
FORMAT: ${format}
PLATFORM: ${platform}
TARGET AUDIENCE: ${audience}

Structure EXACTLY:
**HOOK (3 seconds)**
[opening line — bold, specific, stops the scroll]

**BODY (${format === 'Vlog' ? '60' : '45'} seconds)**
[full script with [PAUSE] markers and [SHOW SCREEN] directions]

**CTA (10 seconds)**
[specific call to action]

**PRODUCTION NOTES**
- Total duration: X seconds
- Platform tips for ${platform}
- Trending angle
- B-roll suggestions`
    const result = await callClaude(prompt, apiKey)
    setScript(result)
    setParsed(parseScript(result))
    setLoading(false)
    setSaved(false)
  }

  const handleMic = () => {
    if (listening) {
      recognition?.stop()
      setListening(false)
      setRecognition(null)
      return
    }
    const r = startListening(
      (text) => { setTopic(text); setListening(false); setRecognition(null) },
      (err) => { setListening(false); setRecognition(null) }
    )
    if (r) { setRecognition(r); setListening(true) }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(script)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePlay = () => {
    if (playing) { stopSpeaking(); setPlaying(false); return }
    setPlaying(true)
    speak(script, () => setPlaying(true), () => setPlaying(false))
  }

  const handleDownload = () => {
    const blob = new Blob([script], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${topic.slice(0, 30).replace(/\s+/g, '-')}-script.txt`
    a.click()
  }

  const handleSave = () => {
    addScript({ id: Date.now(), topic, format, platform, audience, content: script, createdAt: new Date().toISOString() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="grid grid-cols-2 gap-5 h-full fade-in-up">
      {/* Left: Controls */}
      <div className="space-y-4">
        {/* Format */}
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5">
          <p className="text-xs font-syne font-semibold text-zinc-500 uppercase tracking-wider mb-3">Format</p>
          <div className="flex flex-wrap gap-2">
            {FORMATS.map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-dm font-medium transition-all ${
                  format === f
                    ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-black font-semibold'
                    : 'border border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Platform + Audience */}
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5 space-y-3">
          <div>
            <label className="block text-xs font-syne font-semibold text-zinc-500 uppercase tracking-wider mb-2">Platform</label>
            <select value={platform} onChange={e => setPlatform(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold-500/50 font-dm">
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-syne font-semibold text-zinc-500 uppercase tracking-wider mb-2">Audience</label>
            <select value={audience} onChange={e => setAudience(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold-500/50 font-dm">
              {AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {/* Topic */}
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5">
          <p className="text-xs font-syne font-semibold text-zinc-500 uppercase tracking-wider mb-2">Topic</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {QUICK_PICKS.map(q => (
              <button key={q} onClick={() => setTopic(q)}
                className="text-xs border border-white/10 text-zinc-400 px-2.5 py-1 rounded-lg hover:text-white hover:border-gold-500/30 transition-all font-dm">
                {q}
              </button>
            ))}
          </div>
          <div className="relative">
            <textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Type your topic or click a quick pick..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-gold-500/50 transition-colors font-dm resize-none pr-10"
            />
            <button onClick={handleMic}
              className={`absolute right-3 top-3 transition-colors ${listening ? 'text-red-400 animate-pulse' : 'text-zinc-500 hover:text-gold-500'}`}>
              {listening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          </div>
        </div>

        <button
          onClick={generate}
          disabled={loading || !topic.trim()}
          className="w-full bg-gradient-to-r from-gold-500 to-gold-600 text-black font-syne font-bold rounded-xl py-3 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
          {loading ? 'Generating...' : 'Generate Script'}
        </button>

        {/* Recent scripts */}
        {generatedScripts.length > 0 && (
          <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4">
            <p className="text-xs font-syne font-semibold text-zinc-500 uppercase tracking-wider mb-3">Recent Scripts</p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {generatedScripts.slice(0, 8).map(s => (
                <button key={s.id} onClick={() => { setScript(s.content); setParsed(parseScript(s.content)); setTopic(s.topic); setFormat(s.format) }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 transition-colors">
                  <p className="text-xs text-white font-dm truncate">{s.topic}</p>
                  <p className="text-[10px] text-zinc-600 font-dm">{s.format} · {s.platform}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Output */}
      <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5 overflow-y-auto">
        {!script && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Wand2 size={32} className="text-zinc-700 mb-3" />
            <p className="font-syne font-semibold text-zinc-500">Script output will appear here</p>
            <p className="text-xs text-zinc-700 font-dm mt-1">Select a format, enter a topic, and generate</p>
          </div>
        )}

        {loading && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-zinc-500 font-dm">Writing your script...</p>
            </div>
          </div>
        )}

        {script && !loading && (
          <div className="space-y-4">
            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={handleCopy} className="flex items-center gap-1.5 border border-white/10 text-zinc-400 rounded-xl px-3 py-1.5 text-xs font-dm hover:text-white hover:border-white/20 transition-all">
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button onClick={handlePlay} className="flex items-center gap-1.5 border border-white/10 text-zinc-400 rounded-xl px-3 py-1.5 text-xs font-dm hover:text-white hover:border-white/20 transition-all">
                <Volume2 size={13} className={playing ? 'text-gold-500' : ''} />
                {playing ? 'Stop' : 'Listen'}
              </button>
              <button onClick={handleDownload} className="flex items-center gap-1.5 border border-white/10 text-zinc-400 rounded-xl px-3 py-1.5 text-xs font-dm hover:text-white hover:border-white/20 transition-all">
                <Download size={13} />
                .txt
              </button>
              <button onClick={generate} className="flex items-center gap-1.5 border border-white/10 text-zinc-400 rounded-xl px-3 py-1.5 text-xs font-dm hover:text-white hover:border-white/20 transition-all">
                <RotateCcw size={13} />
                Regenerate
              </button>
              <button onClick={handleSave} className="flex items-center gap-1.5 bg-gold-500/15 text-gold-500 border border-gold-500/30 rounded-xl px-3 py-1.5 text-xs font-dm hover:bg-gold-500/25 transition-all">
                {saved ? <Check size={13} /> : <Save size={13} />}
                {saved ? 'Saved!' : 'Save'}
              </button>
            </div>

            {/* Parsed sections */}
            {parsed ? (
              <div className="space-y-3">
                {parsed.hook && (
                  <div className="bg-gold-500/10 border border-gold-500/20 rounded-xl p-4">
                    <p className="text-[10px] font-syne font-bold text-gold-500 uppercase tracking-wider mb-2">Hook — 3 seconds</p>
                    <p className="text-sm text-white font-dm whitespace-pre-wrap">{parsed.hook}</p>
                  </div>
                )}
                {parsed.body && (
                  <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                    <p className="text-[10px] font-syne font-bold text-zinc-400 uppercase tracking-wider mb-2">Body — 45 seconds</p>
                    <p className="text-sm text-zinc-300 font-dm whitespace-pre-wrap">{parsed.body}</p>
                  </div>
                )}
                {parsed.cta && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                    <p className="text-[10px] font-syne font-bold text-emerald-400 uppercase tracking-wider mb-2">CTA — 10 seconds</p>
                    <p className="text-sm text-white font-dm whitespace-pre-wrap">{parsed.cta}</p>
                  </div>
                )}
                {parsed.production && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <p className="text-[10px] font-syne font-bold text-blue-400 uppercase tracking-wider mb-2">Production Notes</p>
                    <p className="text-sm text-zinc-300 font-dm whitespace-pre-wrap">{parsed.production}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                <p className="text-sm text-zinc-300 font-dm whitespace-pre-wrap">{script}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
