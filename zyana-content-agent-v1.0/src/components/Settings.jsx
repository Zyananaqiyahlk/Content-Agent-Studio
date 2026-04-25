import React, { useState } from 'react'
import { Eye, EyeOff, Lock, Copy, Check, RotateCcw, Video } from 'lucide-react'
import { useStore } from '../store'

const GIT_CODE = `git init
git add .
git commit -m "feat: Zyana Content Agent v1.0"
git remote add origin YOUR_REPO_URL
git push -u origin main`

export default function Settings() {
  const { apiKey, setApiKey, higgsfieldKey, higgsfieldSecret, setHiggsfieldKeys, profileName, brandName, niche, setProfile, audioEnabled, setAudioEnabled } = useStore()
  const [key, setKey] = useState(apiKey)
  const [showKey, setShowKey] = useState(false)
  const [keySaved, setKeySaved] = useState(false)
  const [hfKey, setHfKey]       = useState(higgsfieldKey)
  const [hfSecret, setHfSecret] = useState(higgsfieldSecret)
  const [showHfKey, setShowHfKey]       = useState(false)
  const [showHfSecret, setShowHfSecret] = useState(false)
  const [hfSaved, setHfSaved]   = useState(false)
  const [name, setName] = useState(profileName)
  const [brand, setBrand] = useState(brandName)
  const [nicheVal, setNicheVal] = useState(niche)
  const [profileSaved, setProfileSaved] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)

  const saveKey = () => {
    setApiKey(key.trim())
    setKeySaved(true)
    setTimeout(() => setKeySaved(false), 2000)
  }

  const saveHfKeys = () => {
    setHiggsfieldKeys(hfKey.trim(), hfSecret.trim())
    setHfSaved(true)
    setTimeout(() => setHfSaved(false), 2000)
  }

  const saveProfile = () => {
    setProfile({ profileName: name, brandName: brand, niche: nicheVal })
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  const copyCode = () => {
    navigator.clipboard.writeText(GIT_CODE)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const resetAll = () => {
    if (window.confirm('Reset all data? This clears your metrics, scripts, chat history, and settings. Cannot be undone.')) {
      localStorage.clear()
      window.location.reload()
    }
  }

  return (
    <div className="max-w-2xl space-y-5 fade-in-up">
      {/* API Key */}
      <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={16} className="text-gold-500" />
          <p className="font-syne font-bold text-white">Anthropic API Key</p>
        </div>
        <div className="relative mb-3">
          <input
            type={showKey ? 'text' : 'password'}
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-gold-500/50 transition-colors font-dm pr-10"
          />
          <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
            {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <button onClick={saveKey}
          className="bg-gradient-to-r from-gold-500 to-gold-600 text-black font-syne font-bold rounded-xl px-5 py-2.5 text-sm hover:opacity-90 transition-opacity">
          {keySaved ? '✓ Key Saved!' : 'Save Key'}
        </button>
        <p className="text-xs text-zinc-600 font-dm mt-3">Your key is stored locally in your browser. Never share it publicly.</p>
        <p className="text-xs text-zinc-600 font-dm mt-1">Get your key at <span className="text-gold-500">console.anthropic.com</span></p>
      </div>

      {/* Higgsfield API */}
      <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Video size={16} className="text-gold-500" />
          <p className="font-syne font-bold text-white">Higgsfield API — Video Studio</p>
          {higgsfieldKey && higgsfieldSecret && (
            <span className="ml-auto text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full font-dm">Connected</span>
          )}
        </div>
        <p className="text-xs text-zinc-500 font-dm mb-4">
          Powers the Video Studio tab. Get your key + secret from{' '}
          <a href="https://platform.higgsfield.ai" target="_blank" rel="noopener noreferrer" className="text-gold-500 hover:underline">platform.higgsfield.ai</a> → Account → API Keys.
        </p>
        <div className="space-y-3 mb-3">
          {/* API Key */}
          <div>
            <label className="block text-[10px] font-syne font-bold text-zinc-500 uppercase tracking-wider mb-1.5">API Key</label>
            <div className="relative">
              <input
                type={showHfKey ? 'text' : 'password'}
                value={hfKey}
                onChange={e => setHfKey(e.target.value)}
                placeholder="hf_key_..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-gold-500/50 transition-colors font-dm pr-10"
              />
              <button onClick={() => setShowHfKey(!showHfKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                {showHfKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          {/* API Secret */}
          <div>
            <label className="block text-[10px] font-syne font-bold text-zinc-500 uppercase tracking-wider mb-1.5">API Secret</label>
            <div className="relative">
              <input
                type={showHfSecret ? 'text' : 'password'}
                value={hfSecret}
                onChange={e => setHfSecret(e.target.value)}
                placeholder="hf_secret_..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-gold-500/50 transition-colors font-dm pr-10"
              />
              <button onClick={() => setShowHfSecret(!showHfSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                {showHfSecret ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        </div>
        <button onClick={saveHfKeys}
          className="bg-gradient-to-r from-gold-500 to-gold-600 text-black font-syne font-bold rounded-xl px-5 py-2.5 text-sm hover:opacity-90 transition-opacity">
          {hfSaved ? '✓ Keys Saved!' : 'Save Higgsfield Keys'}
        </button>
        <p className="text-xs text-zinc-600 font-dm mt-3">Auth format: <code className="text-zinc-400">Key {'{api_key}'}:{'{api_key_secret}'}</code> — stored locally only.</p>
      </div>

      {/* Profile */}
      <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
        <p className="font-syne font-bold text-white mb-4">Profile</p>
        <div className="space-y-3 mb-4">
          {[
            { label: 'Your Name', val: name, set: setName },
            { label: 'Brand Name', val: brand, set: setBrand },
            { label: 'Niche / Focus', val: nicheVal, set: setNicheVal },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label className="block text-xs font-syne font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">{label}</label>
              <input value={val} onChange={e => set(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold-500/50 transition-colors font-dm" />
            </div>
          ))}
        </div>
        <button onClick={saveProfile}
          className="bg-gradient-to-r from-gold-500 to-gold-600 text-black font-syne font-bold rounded-xl px-5 py-2.5 text-sm hover:opacity-90 transition-opacity">
          {profileSaved ? '✓ Saved!' : 'Save Profile'}
        </button>
      </div>

      {/* Audio */}
      <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-syne font-bold text-white">Text-to-Speech Output</p>
            <p className="text-xs text-zinc-500 font-dm mt-1">Agent Chat will automatically speak responses</p>
          </div>
          <button onClick={() => setAudioEnabled(!audioEnabled)}
            className={`relative w-11 h-6 rounded-full transition-colors ${audioEnabled ? 'bg-gold-500' : 'bg-zinc-700'}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${audioEnabled ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Git setup */}
      <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="font-syne font-bold text-white">Push to GitHub</p>
          <button onClick={copyCode}
            className="flex items-center gap-1.5 border border-white/10 text-zinc-400 rounded-xl px-3 py-1.5 text-xs font-dm hover:text-white transition-all">
            {codeCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            {codeCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="bg-black/40 border border-white/5 rounded-xl p-4 text-xs text-zinc-300 font-mono overflow-x-auto">
          {GIT_CODE}
        </pre>
      </div>

      {/* Pricing tiers */}
      <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
        <p className="font-syne font-bold text-white mb-4">Product Tiers — Sell This App</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Solo', price: '$47', features: ['Personal use', '1 brand profile', 'All 6 features', 'No resale'] },
            { label: 'Agency', price: '$197', features: ['Unlimited clients', 'All features', 'White-label ready', 'Priority support'], featured: true },
            { label: 'White Label', price: '$497', features: ['Full source code', 'Rebrand + resell', 'Unlimited licenses', 'Custom domain'] },
          ].map(({ label, price, features, featured }) => (
            <div key={label} className={`border rounded-xl p-4 ${featured ? 'border-gold-500/40 bg-gold-500/5' : 'border-white/5'}`}>
              {featured && <span className="inline-block text-[10px] font-syne font-bold text-gold-500 bg-gold-500/15 px-2 py-0.5 rounded-full mb-2">BEST VALUE</span>}
              <p className="font-syne font-bold text-white">{label}</p>
              <p className="text-2xl font-syne font-bold text-gold-500 my-2">{price}</p>
              <ul className="space-y-1">
                {features.map(f => (
                  <li key={f} className="text-xs text-zinc-400 font-dm flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-gold-500/60" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* App info + reset */}
      <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500 font-dm">Version 1.0.0 · claude-sonnet-4-20250514 · Built for Zyana Systems</p>
          <p className="text-[10px] text-zinc-700 font-dm mt-0.5">zyanasystems.com</p>
        </div>
        <button onClick={resetAll}
          className="flex items-center gap-1.5 border border-red-500/30 text-red-400 rounded-xl px-3 py-2 text-xs font-dm hover:bg-red-500/10 transition-colors">
          <RotateCcw size={12} /> Reset All Data
        </button>
      </div>
    </div>
  )
}
