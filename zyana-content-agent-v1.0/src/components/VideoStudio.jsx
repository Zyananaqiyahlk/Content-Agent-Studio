import React, { useState, useRef } from 'react'
import { Video, Sparkles, Clock, CheckCircle2, XCircle, Download, RefreshCw, ChevronDown, Play, Wand2, AlertCircle } from 'lucide-react'
import { useStore } from '../store'
import { generateVideo, pollUntilDone, HIGGSFIELD_MODELS, PRESET_PROMPTS } from '../agents/higgsfield'

const ASPECT_OPTIONS = [
  { value: '9:16', label: '9:16 — Reels / TikTok / Shorts', icon: '📱' },
  { value: '16:9', label: '16:9 — YouTube / Landscape',      icon: '🖥️' },
  { value: '1:1',  label: '1:1 — Square',                   icon: '⬜' },
]

const STATUS_CONFIG = {
  queued:      { label: 'Queued',       color: 'text-gold-500',    bg: 'bg-gold-500/10',    icon: Clock },
  in_progress: { label: 'Generating…', color: 'text-blue-400',    bg: 'bg-blue-400/10',    icon: RefreshCw },
  completed:   { label: 'Ready',        color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: CheckCircle2 },
  failed:      { label: 'Failed',       color: 'text-red-400',     bg: 'bg-red-400/10',     icon: XCircle },
  nsfw:        { label: 'Blocked',      color: 'text-red-400',     bg: 'bg-red-400/10',     icon: XCircle },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.queued
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-dm font-medium ${cfg.color} ${cfg.bg}`}>
      <Icon size={11} className={status === 'in_progress' ? 'animate-spin' : ''} />
      {cfg.label}
    </span>
  )
}

function GenerationCard({ gen, onRetry }) {
  return (
    <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-syne font-semibold text-white truncate">{gen.title || 'Custom prompt'}</p>
          <p className="text-[11px] text-zinc-500 font-dm mt-0.5 line-clamp-2">{gen.prompt}</p>
        </div>
        <StatusBadge status={gen.status} />
      </div>

      <div className="flex items-center gap-3 text-[10px] text-zinc-600 font-dm mb-3">
        <span>{gen.aspectRatio}</span>
        <span>·</span>
        <span>{gen.model?.split('/').pop()}</span>
        <span>·</span>
        <span>{new Date(gen.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      {gen.status === 'completed' && gen.outputUrl && (
        <div className="space-y-2">
          <video
            src={gen.outputUrl}
            controls
            className="w-full rounded-xl bg-black max-h-48 object-contain"
          />
          <a
            href={gen.outputUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-gold-500/15 hover:bg-gold-500/25 border border-gold-500/20 text-gold-500 text-xs font-dm font-semibold py-2 rounded-xl transition-colors"
          >
            <Download size={12} /> Download Video
          </a>
        </div>
      )}

      {(gen.status === 'failed' || gen.status === 'nsfw') && (
        <button
          onClick={() => onRetry(gen)}
          className="flex items-center gap-1.5 text-xs font-dm text-zinc-400 hover:text-white transition-colors"
        >
          <RefreshCw size={11} /> Retry
        </button>
      )}
    </div>
  )
}

export default function VideoStudio() {
  const { higgsfieldKey, higgsfieldSecret, videoGenerations, addVideoGeneration, updateVideoGeneration } = useStore()
  const [prompt, setPrompt]           = useState('')
  const [aspectRatio, setAspectRatio] = useState('9:16')
  const [model, setModel]             = useState(HIGGSFIELD_MODELS[0].id)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [activePreset, setActivePreset] = useState(null)
  const [pollStatus, setPollStatus]   = useState('')
  const textareaRef = useRef(null)

  const hasKeys = higgsfieldKey && higgsfieldSecret

  const applyPreset = (preset) => {
    setPrompt(preset.prompt)
    setAspectRatio(preset.aspectRatio)
    setModel(preset.model)
    setActivePreset(preset.title)
    textareaRef.current?.focus()
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setError('')
    setLoading(true)
    setPollStatus('queued')

    const genId = Date.now()
    addVideoGeneration({
      id: genId,
      title: activePreset || null,
      prompt,
      aspectRatio,
      model,
      status: 'queued',
      outputUrl: null,
    })

    try {
      const requestId = await generateVideo({
        prompt,
        aspectRatio,
        resolution: '720p',
        model,
        apiKey: higgsfieldKey,
        apiSecret: higgsfieldSecret,
      })

      updateVideoGeneration(genId, { requestId, status: 'in_progress' })
      setPollStatus('in_progress')

      const result = await pollUntilDone(
        requestId,
        higgsfieldKey,
        higgsfieldSecret,
        (status) => {
          setPollStatus(status)
          updateVideoGeneration(genId, { status })
        }
      )

      updateVideoGeneration(genId, { status: 'completed', outputUrl: result.output_url || result.url })
      setPollStatus('completed')

    } catch (err) {
      setError(err.message)
      updateVideoGeneration(genId, { status: 'failed', error: err.message })
      setPollStatus('')
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = (gen) => {
    setPrompt(gen.prompt)
    setAspectRatio(gen.aspectRatio)
    setModel(gen.model)
    setActivePreset(gen.title)
  }

  return (
    <div className="max-w-4xl space-y-5 fade-in-up">

      {/* No keys warning */}
      {!hasKeys && (
        <div className="bg-gold-500/8 border border-gold-500/20 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={16} className="text-gold-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-syne font-semibold text-white text-sm">Add your Higgsfield keys first</p>
            <p className="font-dm text-zinc-400 text-xs mt-0.5">
              Go to <strong className="text-gold-500">Settings → Higgsfield API</strong> and add your API key + secret.
              Get them at <span className="text-gold-500">platform.higgsfield.ai</span>
            </p>
          </div>
        </div>
      )}

      {/* Preset prompts */}
      <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Wand2 size={15} className="text-gold-500" />
          <p className="font-syne font-bold text-white text-sm">Brand Presets</p>
          <span className="ml-auto text-[10px] text-zinc-600 font-dm">Tuned for your UGC brand</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {PRESET_PROMPTS.map((p) => (
            <button
              key={p.title}
              onClick={() => applyPreset(p)}
              className={`text-left p-3 rounded-xl border transition-all ${
                activePreset === p.title
                  ? 'border-gold-500/50 bg-gold-500/8'
                  : 'border-white/5 bg-white/[0.02] hover:border-white/15'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-syne font-semibold text-white text-xs leading-tight">{p.title}</p>
                <span className="text-[9px] font-dm text-gold-500 bg-gold-500/10 px-1.5 py-0.5 rounded flex-shrink-0">{p.tag}</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-dm line-clamp-2 leading-relaxed">{p.prompt}</p>
              <div className="flex items-center gap-2 mt-2 text-[9px] text-zinc-600 font-dm">
                <span>{p.aspectRatio}</span>
                <span>·</span>
                <span>{p.model.split('/')[1]}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Generator */}
      <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Video size={15} className="text-gold-500" />
          <p className="font-syne font-bold text-white text-sm">Generate Video</p>
          {pollStatus && <StatusBadge status={pollStatus} />}
        </div>

        {/* Prompt */}
        <div className="mb-4">
          <label className="block text-[10px] font-syne font-bold text-zinc-500 uppercase tracking-wider mb-2">Prompt</label>
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={e => { setPrompt(e.target.value); setActivePreset(null) }}
            rows={4}
            placeholder="Describe your video… be cinematic and specific. E.g. 'Close-up of iPhone 15 Pro on marble desk, coral gradient background, soft warm light, slow push-in…'"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-gold-500/50 transition-colors font-dm resize-none"
          />
          <p className="text-[10px] text-zinc-600 font-dm mt-1">{prompt.length}/500 characters</p>
        </div>

        {/* Options row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Aspect ratio */}
          <div>
            <label className="block text-[10px] font-syne font-bold text-zinc-500 uppercase tracking-wider mb-2">Format</label>
            <div className="relative">
              <select
                value={aspectRatio}
                onChange={e => setAspectRatio(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold-500/50 transition-colors font-dm appearance-none pr-8"
              >
                {ASPECT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value} className="bg-zinc-900">{o.icon} {o.label}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          {/* Model */}
          <div>
            <label className="block text-[10px] font-syne font-bold text-zinc-500 uppercase tracking-wider mb-2">Model</label>
            <div className="relative">
              <select
                value={model}
                onChange={e => setModel(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold-500/50 transition-colors font-dm appearance-none pr-8"
              >
                {HIGGSFIELD_MODELS.map(m => (
                  <option key={m.id} value={m.id} className="bg-zinc-900">{m.label} — {m.desc}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-3 mb-4 flex items-start gap-2">
            <XCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-dm text-red-300">{error}</p>
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim() || !hasKeys}
          className="w-full bg-gradient-to-r from-gold-500 to-gold-600 text-black font-syne font-bold rounded-xl py-3 text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              {pollStatus === 'queued' ? 'Queued — waiting for slot…' : 'Generating your video…'}
            </>
          ) : (
            <>
              <Sparkles size={14} />
              Generate with Higgsfield
            </>
          )}
        </button>

        {loading && (
          <p className="text-[11px] text-zinc-500 font-dm text-center mt-2">
            Videos take 2–4 minutes. You can navigate away — generation continues in background.
          </p>
        )}
      </div>

      {/* Generation history */}
      {videoGenerations.length > 0 && (
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Play size={14} className="text-gold-500" />
            <p className="font-syne font-bold text-white text-sm">Generation History</p>
            <span className="ml-auto text-[10px] text-zinc-600 font-dm">{videoGenerations.length} videos</span>
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {videoGenerations.map(gen => (
              <GenerationCard key={gen.id} gen={gen} onRetry={handleRetry} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
