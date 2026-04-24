import React, { useState } from 'react'
import { LayoutDashboard, FileText, BarChart2, Briefcase, Star, MessageSquare, Settings2, Zap, X, Video } from 'lucide-react'
import { useStore } from './store'
import Dashboard from './components/Dashboard'
import ScriptGenerator from './components/ScriptGenerator'
import EngagementTracker from './components/EngagementTracker'
import BrandOutreach from './components/BrandOutreach'
import MediaKit from './components/MediaKit'
import AgentChat from './components/AgentChat'
import Settings from './components/Settings'
import VideoStudio from './components/VideoStudio'

const NAV = [
  { group: 'OVERVIEW', items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  { group: 'CREATE', items: [
    { id: 'script', label: 'Script Generator', icon: FileText },
    { id: 'video', label: 'Video Studio', icon: Video, badge: 'Higgsfield' },
  ]},
  { group: 'GROW', items: [{ id: 'engagement', label: 'Engagement', icon: BarChart2 }] },
  { group: 'MONETIZE', items: [
    { id: 'outreach', label: 'Brand Outreach', icon: Briefcase },
    { id: 'mediakit', label: 'Media Kit', icon: Star },
  ]},
  { group: 'CONFIG', items: [
    { id: 'chat', label: 'Agent Chat', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings2 },
  ]},
]

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  script: 'Script Generator',
  video: 'Video Studio — Higgsfield',
  engagement: 'Engagement Tracker',
  outreach: 'Brand Outreach',
  mediakit: 'Media Kit',
  chat: 'Agent Chat',
  settings: 'Settings',
}

const PAGES = { dashboard: Dashboard, script: ScriptGenerator, video: VideoStudio, engagement: EngagementTracker, outreach: BrandOutreach, mediakit: MediaKit, chat: AgentChat, settings: Settings }

export default function App() {
  const { activeTab, setActiveTab, apiKey, onboarded, setOnboarded, setApiKey } = useStore()
  const [onboardKey, setOnboardKey] = useState('')
  const Page = PAGES[activeTab] || Dashboard

  const handleOnboard = () => {
    if (onboardKey.trim()) setApiKey(onboardKey.trim())
    setOnboarded(true)
  }

  return (
    <div className="flex h-screen bg-[#0A0A0B] overflow-hidden">
      <aside className="w-[220px] flex-shrink-0 bg-[#0E0E11] border-r border-white/5 flex flex-col">
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <Zap size={16} className="text-black" />
            </div>
            <div>
              <p className="font-syne font-bold text-white text-sm leading-none">Zyana</p>
              <p className="text-[10px] text-zinc-500 font-dm">Content Agent</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto">
          {NAV.map(({ group, items }) => (
            <div key={group} className="mb-4">
              <p className="text-[9px] font-syne font-bold text-zinc-600 tracking-widest px-2 mb-1">{group}</p>
              {items.map(({ id, label, icon: Icon, badge }) => {
                const active = activeTab === id
                return (
                  <button key={id} onClick={() => setActiveTab(id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-dm transition-all mb-0.5 ${
                      active ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-black font-semibold' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}>
                    <Icon size={15} />
                    <span className="flex-1 text-left">{label}</span>
                    {badge && !active && (
                      <span className="text-[8px] font-syne font-bold bg-gold-500/20 text-gold-500 px-1.5 py-0.5 rounded-full leading-none">{badge}</span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <div className="bg-gold-500/10 border border-gold-500/20 rounded-xl px-3 py-2">
            <p className="text-[10px] text-zinc-500 font-dm">Current Phase</p>
            <p className="text-xs font-syne font-bold text-gold-500">Day 7 of 90</p>
            <p className="text-[10px] text-zinc-600 font-dm">Phase 1 — Foundation</p>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#0A0A0B] flex-shrink-0">
          <h1 className="font-syne font-bold text-white text-lg">{PAGE_TITLES[activeTab]}</h1>
          <div className="flex items-center gap-3">
            {apiKey ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-dm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                AI Active
              </div>
            ) : (
              <button onClick={() => setActiveTab('settings')} className="text-xs text-gold-500 font-dm border border-gold-500/30 px-3 py-1 rounded-lg hover:bg-gold-500/10 transition-colors">
                Add API Key
              </button>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6"><Page /></main>
      </div>
      {!onboarded && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0E0E11] border border-white/10 rounded-2xl max-w-lg w-full p-8 fade-in-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                <Zap size={20} className="text-black" />
              </div>
              <div>
                <h2 className="font-syne font-bold text-white text-xl">Welcome to Zyana Content Agent</h2>
                <p className="text-sm text-zinc-500 font-dm">Your AI-powered content command center</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { icon: FileText, label: 'Script Generator', desc: 'AI scripts with voice + TTS' },
                { icon: BarChart2, label: 'Engagement Tracker', desc: 'Charts & AI analysis' },
                { icon: Briefcase, label: 'Brand Outreach', desc: 'AI email for 8 prospects' },
                { icon: Star, label: 'Media Kit', desc: 'AI-written, rate card ready' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                  <Icon size={16} className="text-gold-500 mb-1.5" />
                  <p className="text-sm font-syne font-semibold text-white">{label}</p>
                  <p className="text-xs text-zinc-500 font-dm">{desc}</p>
                </div>
              ))}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-dm text-zinc-400 mb-2">Anthropic API Key <span className="text-zinc-600">(optional — add later in Settings)</span></label>
              <input type="password" value={onboardKey} onChange={e => setOnboardKey(e.target.value)} placeholder="sk-ant-..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-gold-500/50 transition-colors font-dm" />
            </div>
            <button onClick={handleOnboard} className="w-full bg-gradient-to-r from-gold-500 to-gold-600 text-black font-syne font-bold rounded-xl py-3 hover:opacity-90 transition-opacity">
              Get Started — Day 7 of 90
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
