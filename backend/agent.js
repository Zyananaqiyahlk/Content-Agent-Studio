import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { callAI, checkCredits, deductCredits } from '../services/aiRouter.js'
import { query } from '../config/database.js'

const router = express.Router()

// POST /api/agent/chat
router.post('/chat', authenticate, async (req, res) => {
  try {
    const { message, model, provider, history = [] } = req.body
    if (!message) return res.status(400).json({ error: 'Message required' })

    await checkCredits(req.user.id, 'agent_chat')

    const fullPrompt = history.length > 0
      ? `Previous context:\n${history.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n')}\n\nCurrent: ${message}`
      : message

    const response = await callAI({
      userId: req.user.id,
      provider: provider || req.user.ai_provider || 'anthropic',
      model: model || req.user.preferred_ai_model || 'claude-sonnet-4-20250514',
      prompt: fullPrompt,
      userProfile: req.user,
      feature: 'agent_chat'
    })

    const creditsUsed = await deductCredits(req.user.id, 'agent_chat')
    const creditsResult = await query('SELECT balance FROM zyana.user_credits WHERE user_id = $1', [req.user.id])

    res.json({ response: response.text, creditsUsed, creditsRemaining: creditsResult.rows[0]?.balance || 0, tokensUsed: response.tokensUsed })
  } catch (error) {
    if (error.code === 'INSUFFICIENT_CREDITS') return res.status(402).json({ error: error.message, code: 'INSUFFICIENT_CREDITS', balance: error.balance, needed: error.needed })
    console.error('Chat error:', error)
    res.status(500).json({ error: error.message || 'Chat failed' })
  }
})

// POST /api/agent/generate-script
router.post('/generate-script', authenticate, async (req, res) => {
  try {
    const { topic, format, platform, audience, model, provider } = req.body
    if (!topic) return res.status(400).json({ error: 'Topic required' })

    await checkCredits(req.user.id, 'script_gen')

    const prompt = `Generate a complete ready-to-film ${format || 'Talking Head'} video script.

TOPIC: ${topic}
FORMAT: ${format || 'Talking Head'}
PLATFORM: ${platform || 'Instagram Reels'}
TARGET AUDIENCE: ${audience || 'general audience'}
CREATOR NICHE: ${req.user.niche}
BRAND: ${req.user.brand_name}

Structure EXACTLY like this:

**HOOK (3 seconds)**
[Attention-grabbing opening — specific, bold, stops the scroll]

**BODY (${format === 'Vlog' ? '60' : '45'} seconds)**
[Full script with [PAUSE] markers and [SHOW SCREEN] directions where relevant]

**CTA (10 seconds)**
[Specific call to action tied to growing followers/engagement]

**PRODUCTION NOTES**
- Total duration: X seconds
- Platform tips for ${platform || 'Instagram Reels'}
- Trending angle to exploit
- B-roll suggestions`

    const response = await callAI({
      userId: req.user.id,
      provider: provider || req.user.ai_provider || 'anthropic',
      model: model || req.user.preferred_ai_model,
      prompt,
      userProfile: req.user,
      feature: 'script_gen'
    })

    // Save script to DB
    const scriptResult = await query(`
      INSERT INTO zyana.scripts (user_id, topic, format, platform, audience, model_name, provider, content, credits_used)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 5)
      RETURNING id, created_at
    `, [req.user.id, topic, format, platform, audience, model || req.user.preferred_ai_model, provider || req.user.ai_provider, response.text])

    const creditsUsed = await deductCredits(req.user.id, 'script_gen')
    const creditsResult = await query('SELECT balance FROM zyana.user_credits WHERE user_id = $1', [req.user.id])

    res.json({
      script: response.text,
      scriptId: scriptResult.rows[0].id,
      creditsUsed,
      creditsRemaining: creditsResult.rows[0]?.balance || 0
    })
  } catch (error) {
    if (error.code === 'INSUFFICIENT_CREDITS') return res.status(402).json({ error: error.message, code: 'INSUFFICIENT_CREDITS' })
    console.error('Script gen error:', error)
    res.status(500).json({ error: error.message || 'Script generation failed' })
  }
})

// POST /api/agent/outreach-email
router.post('/outreach-email', authenticate, async (req, res) => {
  try {
    const { brandName, brandCategory, brandNotes, model, provider } = req.body
    if (!brandName) return res.status(400).json({ error: 'Brand name required' })

    await checkCredits(req.user.id, 'outreach_email')

    const prompt = `Write a personalized UGC brand partnership outreach email from ${req.user.name} at ${req.user.brand_name}.

BRAND TARGET: ${brandName} (${brandCategory || 'Technology'})
WHY THEY FIT: ${brandNotes || 'Relevant to our audience'}
MY NICHE: ${req.user.niche}
MY AUDIENCE: Growing fast, engaged followers in ${req.user.niche}

RULES: Mention something specific about ${brandName}, under 200 words, value-first, confident founder tone.

OUTPUT FORMAT:
Subject: [subject line]

[email body]

[signature]

---
FOLLOW-UP (Day 5): [Short 3-sentence follow-up]
LINKEDIN DM: [75-word LinkedIn version]`

    const response = await callAI({
      userId: req.user.id,
      provider: provider || req.user.ai_provider || 'anthropic',
      model: model || req.user.preferred_ai_model,
      prompt,
      userProfile: req.user,
      feature: 'outreach_email'
    })

    const creditsUsed = await deductCredits(req.user.id, 'outreach_email')
    const creditsResult = await query('SELECT balance FROM zyana.user_credits WHERE user_id = $1', [req.user.id])

    res.json({ email: response.text, creditsUsed, creditsRemaining: creditsResult.rows[0]?.balance || 0 })
  } catch (error) {
    if (error.code === 'INSUFFICIENT_CREDITS') return res.status(402).json({ error: error.message, code: 'INSUFFICIENT_CREDITS' })
    res.status(500).json({ error: error.message || 'Email generation failed' })
  }
})

// GET /api/agent/scripts — user's saved scripts
router.get('/scripts', authenticate, async (req, res) => {
  const result = await query(`
    SELECT id, topic, format, platform, content, credits_used, created_at
    FROM zyana.scripts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50
  `, [req.user.id])
  res.json(result.rows)
})

export default router
