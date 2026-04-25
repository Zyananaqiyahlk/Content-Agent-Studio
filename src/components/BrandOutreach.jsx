import React, { useState } from 'react'
import { Loader2, Copy, Mail, Plus, Check, ChevronDown } from 'lucide-react'
import { useStore } from '../store'
import { callClaude } from '../agents/brain'

const STATUSES = ['prospect', 'contacted', 'interested', 'negotiating', 'closed']
const STATUS_COLORS = {
  prospect: 'bg-zinc-700/50 text-zinc-300',
  contacted: 'bg-blue-500/15 text-blue-400',
  interested: 'bg-gold-500/15 text-gold-500',
  negotiating: 'bg-orange-500/15 text-orange-400',
  closed: 'bg-emerald-500/15 text-emerald-400',
}

export default function BrandOutreach() {
  const { apiKey, brandProspects, updateProspect, addProspect, metrics } = useStore()
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [email, setEmail] = useState('')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newBrand, setNewBrand] = useState({ name: '', category: '', email: '', notes: '' })

  const filtered = filter === 'all' ? brandProspects : brandProspects.filter(p => p.status === filter)
  const statusCounts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: brandProspects.filter(p => p.status === s).length }), {})

  const generate = async (brand) => {
    setSelected(brand)
    setGenerating(true)
    setEmail('')
    const prompt = `Write a personalized UGC brand partnership outreach email from Naqiyah at Zyana Systems to ${brand.name}.
Brand category: ${brand.category}
Why they fit: ${brand.notes}
My stats: ${metrics.followers} followers growing to 10K in 90 days, ${metrics.engagement}% avg engagement, AI automation niche.
Rules: mention something specific about ${brand.name}, under 200 words, value-first, confident founder-to-founder tone.
Output format:
SUBJECT: [subject line]
EMAIL: [email body]
FOLLOW-UP (5 days later): [follow-up version]
LINKEDIN DM: [75-word DM version]`
    const result = await callClaude(prompt, apiKey)
    setEmail(result)
    setGenerating(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleMailto = () => {
    const subjectMatch = email.match(/SUBJECT:\s*(.+)/i)
    const subject = subjectMatch ? subjectMatch[1].trim() : 'Partnership Inquiry — Zyana Systems'
    window.location.href = `mailto:${selected?.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(email)}`
  }

  const handleAdd = () => {
    if (!newBrand.name) return
    addProspect({ ...newBrand, status: 'prospect', relevance: 80 })
    setNewBrand({ name: '', category: '', email: '', notes: '' })
    setShowAddForm(false)
  }

  return (
    <div className="flex gap-5 h-full fade-in-up" style={{ minHeight: 0 }}>
      {/* Left: Brand list */}
      <div className="w-80 flex-shrink-0 space-y-3 overflow-y-auto">
        {/* Pipeline summary */}
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4">
          <p className="text-xs font-syne font-semibold text-zinc-500 uppercase tracking-wider mb-3">Pipeline</p>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-dm transition-all ${filter === 'all' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
              All ({brandProspects.length})
            </button>
            {STATUSES.map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-dm capitalize transition-all ${filter === s ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                {s} ({statusCounts[s]})
              </button>
            ))}
          </div>
        </div>

        {/* Brand cards */}
        <div className="space-y-2">
          {filtered.map(brand => (
            <div key={brand.id}
              className={`bg-zinc-900 border rounded-2xl p-4 cursor-pointer transition-all hover:border-gold-500/30 ${selected?.id === brand.id ? 'border-gold-500/50 bg-gold-500/5' : 'border-white/5'}`}
              onClick={() => setSelected(brand)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-syne font-semibold text-white text-sm">{brand.name}</p>
                  <p className="text-[10px] text-zinc-500 font-dm">{brand.category}</p>
                </div>
                <span className={`text-[10px] font-syne font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[brand.status]}`}>{brand.status}</span>
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-[10px] text-zinc-600 font-dm mb-1">
                  <span>Relevance</span><span>{brand.relevance}%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full">
                  <div className="h-full bg-gradient-to-r from-gold-600 to-gold-400 rounded-full" style={{ width: `${brand.relevance}%` }} />
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 font-dm line-clamp-2 mb-3">{brand.notes}</p>
              <div className="flex items-center gap-2">
                <select value={brand.status} onChange={e => updateProspect(brand.id, { status: e.target.value })}
                  onClick={e => e.stopPropagation()}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-zinc-400 outline-none font-dm">
                  {STATUSES.map(s => <option key={s} value={s} className="bg-zinc-900">{s}</option>)}
                </select>
                <button onClick={(e) => { e.stopPropagation(); generate(brand) }}
                  className="flex items-center gap-1 bg-gradient-to-r from-gold-500 to-gold-600 text-black font-syne font-bold rounded-lg px-2.5 py-1 text-xs hover:opacity-90 transition-opacity">
                  <Mail size={11} /> Email
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add brand */}
        <button onClick={() => setShowAddForm(!showAddForm)}
          className="w-full flex items-center justify-center gap-2 border border-dashed border-white/10 text-zinc-500 rounded-2xl py-3 text-sm font-dm hover:text-white hover:border-white/20 transition-all">
          <Plus size={14} /> Add Brand
        </button>

        {showAddForm && (
          <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 space-y-3">
            {[
              { key: 'name', placeholder: 'Company name' },
              { key: 'category', placeholder: 'Category (e.g. Automation Tool)' },
              { key: 'email', placeholder: 'Contact email' },
            ].map(({ key, placeholder }) => (
              <input key={key} value={newBrand[key]} onChange={e => setNewBrand(b => ({ ...b, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-gold-500/50 font-dm" />
            ))}
            <textarea value={newBrand.notes} onChange={e => setNewBrand(b => ({ ...b, notes: e.target.value }))}
              placeholder="Why they're a good fit..."
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-gold-500/50 font-dm resize-none" />
            <button onClick={handleAdd}
              className="w-full bg-gradient-to-r from-gold-500 to-gold-600 text-black font-syne font-bold rounded-xl py-2 text-sm hover:opacity-90 transition-opacity">
              Add Brand
            </button>
          </div>
        )}
      </div>

      {/* Right: Email output */}
      <div className="flex-1 bg-zinc-900 border border-white/5 rounded-2xl p-5 overflow-y-auto">
        {!selected && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Mail size={32} className="text-zinc-700 mb-3" />
            <p className="font-syne font-semibold text-zinc-500">Select a brand to generate outreach</p>
            <p className="text-xs text-zinc-700 font-dm mt-1">AI will write a personalized email for each prospect</p>
          </div>
        )}

        {selected && !email && !generating && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="bg-gold-500/10 border border-gold-500/20 rounded-2xl p-6 max-w-sm">
              <p className="font-syne font-bold text-white text-lg mb-1">{selected.name}</p>
              <p className="text-sm text-zinc-500 font-dm mb-4">{selected.email}</p>
              <button onClick={() => generate(selected)}
                className="flex items-center gap-2 mx-auto bg-gradient-to-r from-gold-500 to-gold-600 text-black font-syne font-bold rounded-xl px-5 py-2.5 hover:opacity-90 transition-opacity">
                <Mail size={14} /> Generate Outreach Email
              </button>
            </div>
          </div>
        )}

        {generating && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-zinc-500 font-dm">Writing personalized email for {selected?.name}...</p>
            </div>
          </div>
        )}

        {email && !generating && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-syne font-bold text-white">{selected?.name} Outreach</p>
                <p className="text-xs text-zinc-500 font-dm">{selected?.email}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCopy}
                  className="flex items-center gap-1.5 border border-white/10 text-zinc-400 rounded-xl px-3 py-1.5 text-xs font-dm hover:text-white transition-all">
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={handleMailto}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-gold-500 to-gold-600 text-black font-syne font-bold rounded-xl px-3 py-1.5 text-xs hover:opacity-90 transition-opacity">
                  <Mail size={13} /> Open in Mail
                </button>
              </div>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
              <p className="text-sm text-zinc-300 font-dm whitespace-pre-wrap">{email}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}