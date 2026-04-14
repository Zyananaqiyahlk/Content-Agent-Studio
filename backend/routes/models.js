import express from 'express'

const router = express.Router()

// GET /api/models — returns all available AI models grouped by provider
router.get('/', (req, res) => {
  const models = [
    // Anthropic
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4',  provider: 'anthropic', label: 'Anthropic', available: !!process.env.CLAUDE_API_KEY },
    { id: 'claude-opus-4-5',          name: 'Claude Opus 4',    provider: 'anthropic', label: 'Anthropic', available: !!process.env.CLAUDE_API_KEY },
    // OpenAI
    { id: 'gpt-4o',                   name: 'GPT-4o',           provider: 'openai',    label: 'OpenAI',    available: !!process.env.OPENAI_API_KEY },
    { id: 'gpt-4o-mini',              name: 'GPT-4o Mini',      provider: 'openai',    label: 'OpenAI',    available: !!process.env.OPENAI_API_KEY },
    // Google
    { id: 'gemini-1.5-pro',           name: 'Gemini 1.5 Pro',   provider: 'google',    label: 'Google',    available: !!process.env.GOOGLE_API_KEY },
    { id: 'gemini-1.5-flash',         name: 'Gemini 1.5 Flash', provider: 'google',    label: 'Google',    available: !!process.env.GOOGLE_API_KEY },
    // Together AI
    { id: 'meta-llama/Llama-3-70b-chat-hf', name: 'Llama 3 70B', provider: 'together', label: 'Together AI', available: !!process.env.TOGETHER_API_KEY },
  ]

  // Always return all models; frontend can show unavailable ones dimmed
  res.json(models)
})

export default router
