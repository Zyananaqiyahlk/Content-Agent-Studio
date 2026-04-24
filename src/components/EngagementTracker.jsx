import React, { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Loader2, TrendingUp } from 'lucide-react'
import { useStore } from '../store'
import { callClaude } from '../agents/brain'

const VIEWS_DATA = [
  { day: 'Day 1', views: 420 }, { day: 'Day 2', views: 680 }, { day: 'Day 3', views: 1200 },
  { day: 'Day 4', views: 890 }, { day: 'Day 5', views: 2100 }, { day: 'Day 6', views: 1800 }, { day: 'Day 7', views: 3200 },
]
const ENG_DATA = [
  { day: 'Day 1', rate: 3.2 }, { day: 'Day 2', rate: 4.1 }, { day: 'Day 3', rate: 5.8 },
  { day: 'Day 4', rate: 3.9 }, { day: 'Day 5', rate: 7.2 }, { day: 'Day 6', rate: 6.1 }, { day: 'Day 7', rate: 8.4 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-dm">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color }}>{p.value.toLocaleString()}{p.name === 'Engagement' ? '%' : ''}</p>)}
    </div>
  )
}

function ProgressBar({ label, current, target, unit = '' }) {
  const pct = Math.min((current / target) * 100, 100)
  return (
    <div>
      <div className="flex justify-between text-xs font-dm mb-1.5">
        <span className="text-zinc-400">{label}</span>
        <span className="text-white">{current}{unit} / {target}{unit}</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-gold-600 to-gold-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-zinc-600 font-dm mt-1">{pct.toFixed(1)}% of monthly goal</p>
    </div>
  )
}

export default function EngagementTracker() {
  const { apiKey, metrics, updateMetrics } = useStore()
  const [form, setForm] = useState({
    followers: metrics.followers, engagement: metrics.engagement, avgViews: metrics.avgViews,
    emailSubs: metrics.emailSubs, dmInquiries: metrics.dmInquiries, brandDeals: metrics.brandDeals,
  })
  const [analysis, setAnalysis] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [saved, setSaved] = useState(false)

  const saveMetrics = () => { updateMetrics(form); setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const getAnalysis = async () => {
    setAnalyzing(true)
    const prompt = `Analyze these Zyana Systems content metrics and give 3 specific, actionable recommendations.\nMetrics: ${JSON.stringify({ ...metrics, ...form })}\nEach recommendation under 2 sentences. Be specific with numbers.`
    const result = await callClaude(prompt, apiKey)
    setAnalysis(result)
    setAnalyzing(false)
  }

  return (
    <div className="space-y-5 fade-in-up">
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5">
          <p className="font-syne font-semibold text-white mb-4">Update Real Metrics</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[{key:'followers',label:'Followers'},{key:'avgViews',label:'Avg Views'},{key:'engagement',label:'Engagement %'},{key:'emailSubs',label:'Email Subs'},{key:'dmInquiries',label:'DM Inquiries'},{key:'brandDeals',label:'Brand Deals'}].map(({key,label}) => (
              <div key={key}>
                <label className="block text-[10px] font-syne font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">{label}</label>
                <input type="number" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-gold-500/50 font-dm" />
              </div>
            ))}
          </div>
          <button onClick={saveMetrics} className="w-full bg-gradient-to-r from-gold-500 to-gold-600 text-black font-syne font-bold rounded-xl py-2.5 text-sm hover:opacity-90">
            {saved ? '✓ Saved!' : 'Save Metrics'}
          </button>
        </div>
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5">
          <p className="font-syne font-semibold text-white mb-4">Monthly Goals</p>
          <div className="space-y-4">
            <ProgressBar label="Followers" current={metrics.followers} target={800} />
            <ProgressBar label="Engagement Rate" current={metrics.engagement} target={8} unit="%" />
            <ProgressBar label="Email Subscribers" current={metrics.emailSubs} target={50} />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[{platform:'Instagram',views:'1.8K',growth:'+12%'},{platform:'TikTok',views:'3.2K',growth:'+28%'},{platform:'YouTube',views:'680',growth:'+8%'}].map(({platform,views,growth}) => (
              <div key={platform} className="bg-white/[0.03] border border-white/5 rounded-xl p-3 text-center">
                <p className="text-[10px] text-zinc-600 font-syne font-bold uppercase tracking-wider">{platform}</p>
                <p className="text-lg font-syne font-bold text-white mt-1">{views}</p>
                <p className="text-xs text-emerald-400 font-dm">{growth}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-5">
        {[[VIEWS_DATA,'Views Per Video','views','Views'],[ENG_DATA,'Engagement Rate %','rate','Engagement']].map(([data,title,key,name]) => (
          <div key={title} className="bg-zinc-900 border border-white/5 rounded-2xl p-5">
            <p className="font-syne font-semibold text-white mb-4">{title}</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="day" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey={key} fill="#D4A843" radius={[4, 4, 0, 0]} name={name} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
      <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-syne font-semibold text-white">AI Growth Analysis</p>
          <button onClick={getAnalysis} disabled={analyzing}
            className="flex items-center gap-2 bg-gradient-to-r from-gold-500 to-gold-600 text-black font-syne font-bold rounded-xl px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50">
            {analyzing ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
            {analyzing ? 'Analyzing...' : 'Get AI Analysis'}
          </button>
        </div>
        {analysis ? (
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
            <p className="text-sm text-zinc-300 font-dm whitespace-pre-wrap">{analysis}</p>
          </div>
        ) : (
          <p className="text-sm text-zinc-600 font-dm">Click "Get AI Analysis" for personalized growth recommendations based on your current metrics.</p>
        )}
      </div>
    </div>
  )
}
