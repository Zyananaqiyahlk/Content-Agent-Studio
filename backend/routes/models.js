import express from 'express'
const router = express.Router()

const MODELS = [
  { id: 'claude-sonnet-4-20250514',       name: 'Claude Sonnet 4',  provider: 'anthropic', speed: 'fast'    },
  { id: 'claude-haiku-4-5-20251001',      name: 'Claude Haiku',     provider: 'anthropic', speed: 'fastest' },
  { id: 'gpt-4o',                         name: 'GPT-4o',           provider: 'openai',    speed: 'fast'    },
  { id: 'gpt-4o-mini',                    name: 'GPT-4o Mini',      provider: 'openai',    speed: 'fastest' },
  { id: 'gemini-1.5-pro',                 name: 'Gemini 1.5 Pro',   provider: 'google',    speed: 'fast'    },
  { id: 'gemini-1.5-flash',               name: 'Gemini Flash',     provider: 'google',    speed: 'fastest' },
  { id: 'meta-llama/Llama-3-70b-chat-hf', name: 'Llama 3 70B',     provider: 'together',  speed: 'fast'    },
]

router.get('/', (req, res) => {
  res.json(MODELS.map(m => ({
    ...m,
    available: m.provider === 'anthropic' ? !!process.env.CLAUDE_API_KEY
             : m.provider === 'openai'    ? !!process.env.OPENAI_API_KEY
             : m.provider === 'google'    ? !!process.env.GOOGLE_API_KEY
             : !!process.env.TOGETHER_API_KEY
  })))
})

router.get('/provider/:provider', (req, res) => {
  const filtered = MODELS.filter(m => m.provider === req.params.provider)
  if (!filtered.length) return res.status(404).json({ error: `No models for: ${req.params.provider}` })
  res.json(filtered)
})

export default router
