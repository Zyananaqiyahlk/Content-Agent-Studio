const BASE_URL = 'https://platform.higgsfield.ai'

// Available models — text-to-video
export const HIGGSFIELD_MODELS = [
  { id: 'higgsfield-ai/soul/standard',  label: 'Soul (Standard)',  desc: 'Cinematic quality, slower',  tag: 'Best Quality' },
  { id: 'higgsfield-ai/dop/standard',   label: 'DOP (Standard)',   desc: 'Director-of-photography look', tag: 'Cinematic' },
]

// Preset prompts tuned for Naqiyah's UGC brand
export const PRESET_PROMPTS = [
  {
    title: '"The Setup"',
    tag: 'Apple Lifestyle',
    prompt: 'Cinematic close-up of MacBook Pro, iPhone 15 Pro, and iPad Pro arranged on a minimal desk. Soft warm morning light. Slow dolly push-in. Founder aesthetic. 4K.',
    aspectRatio: '9:16',
    model: 'higgsfield-ai/soul/standard',
  },
  {
    title: '"3am Build"',
    tag: 'Founder Story',
    prompt: 'Time-lapse of a dark home office — glowing MacBook screen, lines of code scrolling, coffee steam rising. AI agent workflow visible on screen. Moody blue tones.',
    aspectRatio: '9:16',
    model: 'higgsfield-ai/dop/standard',
  },
  {
    title: '"Before & After"',
    tag: 'Product Demo',
    prompt: 'Split screen: left side shows stack of paper freight forms and stressed broker on phone; right side shows clean AI dashboard auto-filling quotes in seconds. Sharp contrast lighting.',
    aspectRatio: '16:9',
    model: 'higgsfield-ai/dop/standard',
  },
  {
    title: '"iPhone Reel Hook"',
    tag: 'UGC Ad',
    prompt: 'iPhone 15 Pro held in hand, screen showing a live AI agent dashboard. Fingers scrolling. Coral gradient background. Trendy creator lighting. Vertical format.',
    aspectRatio: '9:16',
    model: 'higgsfield-ai/soul/standard',
  },
  {
    title: '"Founder Walk"',
    tag: 'Lifestyle',
    prompt: 'Young female founder walking through a modern co-working space, AirPods in, Apple Watch on wrist, glancing at iPhone with a confident smile. Warm golden hour light.',
    aspectRatio: '9:16',
    model: 'higgsfield-ai/soul/standard',
  },
]

function buildHeaders(apiKey, apiSecret) {
  return {
    'Authorization': `Key ${apiKey}:${apiSecret}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
}

export async function generateVideo({ prompt, aspectRatio = '9:16', resolution = '720p', model, apiKey, apiSecret }) {
  if (!apiKey || !apiSecret) throw new Error('Add your Higgsfield API key and secret in Settings first.')

  const res = await fetch(`${BASE_URL}/${model}`, {
    method: 'POST',
    headers: buildHeaders(apiKey, apiSecret),
    body: JSON.stringify({ prompt, aspect_ratio: aspectRatio, resolution }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Generation failed (${res.status})`)
  }

  const data = await res.json()
  return data.request_id || data.id
}

export async function checkStatus(requestId, apiKey, apiSecret) {
  const res = await fetch(`${BASE_URL}/requests/${requestId}/status`, {
    headers: buildHeaders(apiKey, apiSecret),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Status check failed (${res.status})`)
  }

  return res.json()
  // Returns: { status: 'queued' | 'in_progress' | 'completed' | 'failed' | 'nsfw', output_url?: string }
}

// Poll until done — calls onProgress(status) each tick
export async function pollUntilDone(requestId, apiKey, apiSecret, onProgress, intervalMs = 4000, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, intervalMs))
    const result = await checkStatus(requestId, apiKey, apiSecret)
    onProgress(result.status)

    if (result.status === 'completed') return result
    if (result.status === 'failed')   throw new Error('Generation failed — credits refunded.')
    if (result.status === 'nsfw')     throw new Error('Content flagged by moderation — credits refunded.')
  }
  throw new Error('Timed out — generation is taking longer than expected. Check your Higgsfield dashboard.')
}
