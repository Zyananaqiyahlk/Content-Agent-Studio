import { callClaude, callOpenAI, callGemini, callLlama } from './providers/index.js'
import { query } from '../config/database.js'

function getSystemKey(provider) {
  const keys = {
    anthropic: process.env.CLAUDE_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    google: process.env.GOOGLE_API_KEY,
    together: process.env.TOGETHER_API_KEY,
  }
  return keys[provider]
}

function buildSystemPrompt(userProfile) {
  return `You are a professional AI content creation agent for ${userProfile.brand_name || userProfile.name}.

Brand: ${userProfile.brand_name || 'Your Brand'}
Creator: ${userProfile.name}
Niche: ${userProfile.niche || 'content creation'}

Your role: Help create content, generate video scripts, write brand outreach emails, and grow social media presence.

CONTENT RULES:
- Always be specific — use numbers, examples, and real scenarios relevant to the user's niche
- Script structure: [HOOK] 3 seconds, [BODY] 40-50 seconds, [CTA] 8-10 seconds
- Adapt tone and examples to the user's specific niche: ${userProfile.niche}
- Be direct, data-backed, and actionable
- When writing outreach emails: personalized, value-first, under 200 words
- Lead with the most actionable insight first`
}

export async function callAI({ userId, provider, model, prompt, userProfile, feature = 'agent_chat' }) {
  const apiKey = getSystemKey(provider)
  if (!apiKey) throw new Error(`No API key configured for ${provider}. Contact support.`)

  const systemPrompt = buildSystemPrompt(userProfile)

  let response
  const start = Date.now()

  try {
    switch (provider) {
      case 'anthropic': response = await callClaude(prompt, apiKey, model, systemPrompt); break
      case 'openai':    response = await callOpenAI(prompt, apiKey, model, systemPrompt); break
      case 'google':    response = await callGemini(prompt, apiKey, model, systemPrompt); break
      case 'together':  response = await callLlama(prompt, apiKey, model, systemPrompt); break
      default: throw new Error(`Unknown provider: ${provider}`)
    }

    const duration = Date.now() - start
    console.log(`✅ AI call: ${provider}/${model} | ${response.tokensUsed} tokens | ${duration}ms | $${response.costToYou.toFixed(6)}`)

    // Log usage to DB
    await query(`
      INSERT INTO zyana.usage_logs (user_id, feature, model_name, provider, credits_used, tokens_used, cost_to_platform, prompt_preview, success)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
    `, [userId, feature, model, provider, getCreditCost(feature), response.tokensUsed, response.costToYou, prompt.substring(0, 200)])

    return response
  } catch (error) {
    // Log failed attempt
    await query(`
      INSERT INTO zyana.usage_logs (user_id, feature, model_name, provider, credits_used, tokens_used, cost_to_platform, prompt_preview, success)
      VALUES ($1, $2, $3, $4, 0, 0, 0, $5, false)
    `, [userId, feature, model, provider, prompt.substring(0, 200)]).catch(() => {})
    throw error
  }
}

export function getCreditCost(feature) {
  const costs = {
    script_gen: parseInt(process.env.CREDITS_PER_SCRIPT) || 5,
    agent_chat: parseInt(process.env.CREDITS_PER_CHAT) || 3,
    outreach_email: parseInt(process.env.CREDITS_PER_EMAIL) || 5,
    media_kit: parseInt(process.env.CREDITS_PER_MEDIAKIT) || 10,
  }
  return costs[feature] || 3
}

export async function checkCredits(userId, feature) {
  const result = await query('SELECT balance FROM zyana.user_credits WHERE user_id = $1', [userId])
  const balance = result.rows[0]?.balance || 0
  const needed = getCreditCost(feature)
  if (balance < needed) throw { code: 'INSUFFICIENT_CREDITS', balance, needed, message: `You need ${needed} credits but only have ${balance}` }
  return { balance, needed }
}

export async function deductCredits(userId, feature) {
  const needed = getCreditCost(feature)
  await query(`
    UPDATE zyana.user_credits
    SET balance = balance - $1, total_used = total_used + $1, updated_at = NOW()
    WHERE user_id = $2
  `, [needed, userId])
  return needed
}
