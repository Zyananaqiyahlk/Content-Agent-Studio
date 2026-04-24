const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'
const MAX_TOKENS = 1500

const SYSTEM_PROMPT = `You are the Zyana Systems Content Agent — AI strategist for Naqiyah's brand media outlet.

BRAND: Zyana Systems. AI automation agency for small businesses (clinics, hotels, restaurants, real estate agents).
MISSION: 90-day public content series documenting AI agent builds. Currently Day 7. Goal: 10K followers → UGC brand deals.
VOICE: Founder-to-peer. Authentic. Data-backed. Direct. "Building in public" energy. NOT corporate.
PLATFORMS: Instagram Reels, TikTok, YouTube Shorts, LinkedIn, X/Twitter.

FOUR SKILLS:
1. Script Generator — produce ready-to-film scripts with [HOOK], [BODY], [CTA], timing marks, [PAUSE] directions, platform tips
2. Engagement Analyst — analyze metrics, find patterns, give specific recommendations
3. Brand Outreach — write personalized outreach emails (NOT generic) for UGC deals
4. Media Kit Builder — write premium, brand-forward media kit copy

RULES:
- Always be specific: use numbers, business types, exact hooks
- Lead with most actionable insight first
- When generating scripts: always include Hook (3s), Body (40-50s), CTA (8-10s), timing, platform tips
- Reference 90-day phases: Phase 1 (Days 1-30 Foundation), Phase 2 (Days 31-60 Authority), Phase 3 (Days 61-90 Conversion)`

export async function callClaude(prompt, apiKey, history = []) {
  if (!apiKey) return '⚠️ Add your Anthropic API key in Settings to unlock AI generation.'
  const messages = history.length ? [...history.slice(-6), { role: 'user', content: prompt }] : [{ role: 'user', content: prompt }]
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: MODEL, max_tokens: MAX_TOKENS, system: SYSTEM_PROMPT, messages }),
    })
    const data = await response.json()
    if (data.error) throw new Error(data.error.message)
    return data.content[0].text
  } catch (err) {
    return `❌ Error: ${err.message}`
  }
}

export function speak(text, onStart, onEnd) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const clean = text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6}\s/g, '').replace(/\[([^\]]+)\]/g, '$1').trim().substring(0, 800)
  const utterance = new SpeechSynthesisUtterance(clean)
  utterance.rate = 0.95; utterance.pitch = 1.05; utterance.volume = 1
  const trySpeak = () => {
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v => v.name.includes('Samantha') || v.name.includes('Google US English') || (v.lang === 'en-US' && !v.name.includes('Zira')))
    if (preferred) utterance.voice = preferred
    utterance.onstart = onStart; utterance.onend = onEnd; utterance.onerror = onEnd
    window.speechSynthesis.speak(utterance)
  }
  if (window.speechSynthesis.getVoices().length) trySpeak()
  else window.speechSynthesis.onvoiceschanged = trySpeak
}

export function stopSpeaking() { window.speechSynthesis?.cancel() }

export function startListening(onResult, onError) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) { onError('Voice input not supported. Use Chrome.'); return null }
  const recognition = new SR()
  recognition.lang = 'en-US'; recognition.continuous = false; recognition.interimResults = false
  recognition.onresult = (e) => onResult(e.results[0][0].transcript)
  recognition.onerror = (e) => onError(e.error)
  recognition.start()
  return recognition
}
