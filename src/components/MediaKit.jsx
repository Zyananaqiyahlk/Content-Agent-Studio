import React, { useState } from 'react'
import { Loader2, Copy, Check, Download, ChevronDown, ChevronUp, Wand2 } from 'lucide-react'
import { useStore } from '../store'
import { callClaude } from '../agents/brain'

const DEFAULT_SECTIONS = {
  about: `Zyana Systems is an AI automation agency founded by Naqiyah, helping small businesses implement custom AI agents that save 10+ hours per week. We document every build publicly across Instagram, TikTok, and YouTube Shorts — creating authentic, educational content that converts viewers into clients.

Our 90-day public content series covers real-world AI builds for clinics, hotels, real estate agencies, and restaurants. Every post is grounded in actual deployments, giving our audience the trust signal that most creators can't offer: we build what we teach.`,

  audience: `Our audience is built from small business owners and decision-makers who are actively looking to implement AI in their operations.

• Age range: 28–45
• Small business owners: 60%
• Founders & entrepreneurs: 25%
• Agency owners & operators: 15%
• Average household income: $75K–$250K
• Primary platforms: Instagram (mobile-first), TikTok, YouTube Shorts
• High purchase intent — follows accounts to solve real problems`,

  engagement: `Zyana Systems maintains consistently above-average engagement metrics in the AI/automation niche:

• 8.4% average engagement rate (2x industry standard of 3–4%)
• Growing 100+ followers/day in Phase 1 (Days 1–30)
• Content regularly reaches non-followers through the algorithm
• Audience comments with specific questions, showing high intent
• DMs average 15–25/week from business owners ready to implement`,

  packages: `We offer three partnership tiers designed to fit your campaign goals:

STARTER — Single Video Integration
Perfect for product demos and tool tutorials. Includes: 1 Instagram Reel or TikTok (60s), usage rights for 90 days, link in bio for 7 days.

GROWTH — Multi-Platform Campaign
Our most popular package. Includes: 3 Reels + Instagram Stories (5 slides) + LinkedIn post, 30-day usage rights, tagged mentions across platforms.

PREMIUM — Full Campaign Partnership
Built for brands wanting sustained visibility. Includes: 5 content pieces across all platforms, 30-day bio feature, ManyChat keyword integration, monthly analytics report.`,

  why: `Authentic integration only — every product I promote is one I actually use in my workflow. My audience trusts my recommendations because they watch me build with these tools in real time.

When I recommend n8n for automation or Bland AI for voice agents, I'm showing the exact workflow I built for a paying client — not reading from a brief. That level of authenticity is rare in the creator economy.

Partners report that Zyana Systems audiences convert at higher-than-average rates because they arrive pre-educated and pre-sold on the tool's use case.`,
}

const SECTION_LABELS = {
  about: 'About Zyana Systems',
  audience: 'Audience Demographics',
  engagement: 'Engagement Highlights',
  packages: 'Partnership Packages',
  why: 'Why Partner With Us',
}

export default function MediaKit() {
  const { apiKey, metrics, rateCard, updateRateCard } = useStore()
  const [sections, setSections] = useState({ ...DEFAULT_SECTIONS })
  const [open, setOpen] = useState({ about: true, audience: false, engagement: false, packages: false, why: false })
  const [generating, setGenerating] = useState({})
  const [copied, setCopied] = useState({})
  const [rates, setRates] = useState({ ...rateCard })
  const [ratesSaved, setRatesSaved] = useState(false)

  const generate = async (key) => {
    setGenerating(g => ({ ...g, [key]: true }))
    const prompt = `Write premium media kit copy for the "${SECTION_LABELS[key]}" section for Zyana Systems.
Context: Naqiyah, AI automation content creator, 90-day public series, goal 10K followers, Instagram/TikTok/YouTube.
Current metrics: ${metrics.followers} followers, ${metrics.engagement}% engagement rate.
Make it brand-forward, confident, specific, and compelling to a brand partnerships manager. 150-200 words.`
    const result = await callClaude(prompt, apiKey)
    setSections(s => ({ ...s, [key]: result }))
    setGenerating(g => ({ ...g, [key]: false }))
  }

  const copy = (key) => {
    navigator.clipboard.writeText(sections[key])
    setCopied(c => ({ ...c, [key]: true }))
    setTimeout(() => setCopied(c => ({ ...c, [key]: false })), 2000)
  }

  const saveRates = () => {
    updateRateCard(rates)
    setRatesSaved(true)
    setTimeout(() => setRatesSaved(false), 2000)
  }

  const exportKit = () => {
    const content = `ZYANA SYSTEMS — MEDIA KIT
Generated: ${new Date().toLocaleDateString()}
=====================================

RATE CARD
---------
Starter: $${rates.singleVideo} — Single Video
Growth: $${rates.bundle3x} — 3-Piece Bundle
Premium: $${rates.monthly} — Full Campaign

${Object.keys(SECTION_LABELS).map(k => `
${SECTION_LABELS[k].toUpperCase()}
${'-'.repeat(SECTION_LABELS[k].length)}
${sections[k]}
`).join('\n')}

---
zyanasystems.com
`
    const blob = new Blob([content], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'zyana-media-kit.txt'
    a.click()
  }

  return (
    <div className="max-w-3xl space-y-5 fade-in-up">
      {/* Rate Card */}
      <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="font-syne font-bold text-white text-lg">Rate Card</p>
          <button onClick={saveRates}
            className="bg-gradient-to-r from-gold-500 to-gold-600 text-black font-syne font-bold rounded-xl px-4 py-2 text-sm hover:opacity-90 transition-opacity">
            {ratesSaved ? 'Saved' : 'Save Rates'}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { key: 'singleVideo', label: 'Starter', desc: '1 Instagram Reel + usage rights', features: ['1 Reel (60s)', 'Usage rights 90 days', 'Link in bio 7 days'] },
            { key: 'bundle3x', label: 'Growth', desc: '3 Reels + Stories + LinkedIn', features: ['3 Reels', 'Instagram Stories (5 slides)', 'LinkedIn post', '30-day usage rights'], featured: true },
            { key: 'monthly', label: 'Premium', desc: 'Full campaign — 5 pieces', features: ['5 content pieces', '30-day bio feature', 'ManyChat integration', 'Analytics report'] },
          ].map(({ key, label, desc, features, featured }) => (
            <div key={key} className={`border rounded-2xl p-4 ${featured ? 'border-gold-500/40 bg-gold-500/5' : 'border-white/5 bg-white/[0.02]'}`}>
              {featured && <span className="inline-block text-[10px] font-syne font-bold text-gold-500 bg-gold-500/15 px-2 py-0.5 rounded-full mb-2">POPULAR</span>}
              <p className="font-syne font-bold text-white mb-1">{label}</p>
              <p className="text-xs text-zinc-500 font-dm mb-3">{desc}</p>
              <div className="flex items-center gap-1 mb-3">
                <span className="text-lg font-syne font-bold text-gold-500">$</span>
                <input
                  type="number"
                  value={rates[key]}
                  onChange={e => setRates(r => ({ ...r, [key]: Number(e.target.value) }))}
                  className="w-24 bg-transparent text-2xl font-syne font-bold text-white outline-none border-b border-white/10 focus:border-gold-500/50"
                />
                <span className="text-xs text-zinc-500 font-dm">/deal</span>
              </div>
              <ul className="space-y-1">
                {features.map(f => (
                  <li key={f} className="flex items-center gap-1.5 text-xs text-zinc-400 font-dm">
                    <span className="w-1 h-1 rounded-full bg-gold-500/60" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Sections */}
      {Object.keys(SECTION_LABELS).map(key => (
        <div key={key} className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden">
          <button
            onClick={() => setOpen(o => ({ ...o, [key]: !o[key] }))}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
          >
            <p className="font-syne font-semibold text-white">{SECTION_LABELS[key]}</p>
            {open[key] ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
          </button>
          {open[key] && (
            <div className="px-5 pb-5">
              <div className="flex gap-2 mb-3">
                <button onClick={() => generate(key)} disabled={generating[key]}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-gold-500 to-gold-600 text-black font-syne font-bold rounded-xl px-3 py-1.5 text-xs hover:opacity-90 transition-opacity disabled:opacity-50">
                  {generating[key] ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                  {generating[key] ? 'Writing...' : 'Generate with AI'}
                </button>
                <button onClick={() => copy(key)}
                  className="flex items-center gap-1.5 border border-white/10 text-zinc-400 rounded-xl px-3 py-1.5 text-xs font-dm hover:text-white transition-all">
                  {copied[key] ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copied[key] ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                <p className="text-sm text-zinc-300 font-dm whitespace-pre-wrap leading-relaxed">{sections[key]}</p>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Export */}
      <button onClick={exportKit}
        className="w-full flex items-center justify-center gap-2 border border-gold-500/30 text-gold-500 bg-gold-500/5 font-syne font-bold rounded-2xl py-3.5 hover:bg-gold-500/10 transition-colors">
        <Download size={16} />
        Export Full Media Kit (.txt)
      </button>
    </div>
  )
}