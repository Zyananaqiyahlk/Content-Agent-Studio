import express from 'express'
import bcrypt from 'bcryptjs'
import { query } from '../config/database.js'
import { generateToken, authenticate } from '../middleware/auth.js'

const router = express.Router()

const FREE_CREDITS = parseInt(process.env.FREE_CREDITS_ON_SIGNUP) || 25

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, brandName, niche } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    // Check if email exists
    const existing = await query('SELECT id FROM zyana.users WHERE email = $1', [email.toLowerCase()])
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const userResult = await query(`
      INSERT INTO zyana.users (email, password_hash, name, brand_name, niche)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, name, brand_name, niche, preferred_ai_model, ai_provider, created_at
    `, [email.toLowerCase(), passwordHash, name, brandName || name, niche || 'content_creation'])

    const user = userResult.rows[0]

    // Create credits account with free credits
    await query(`
      INSERT INTO zyana.user_credits (user_id, balance, subscription_tier)
      VALUES ($1, $2, 'free')
    `, [user.id, FREE_CREDITS])

    // Log as transaction
    await query(`
      INSERT INTO zyana.transactions (user_id, type, amount_usd, credits_added, status, metadata)
      VALUES ($1, 'signup_bonus', 0, $2, 'completed', '{"source": "signup"}')
    `, [user.id, FREE_CREDITS])

    const token = generateToken(user.id)

    console.log(`✅ New signup: ${email} (${name})`)
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, brandName: user.brand_name, niche: user.niche },
      credits: FREE_CREDITS,
      message: `Welcome! You have ${FREE_CREDITS} free credits to get started.`
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ error: 'Signup failed. Please try again.' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    const result = await query(`
      SELECT id, email, password_hash, name, brand_name, niche, preferred_ai_model, ai_provider, is_active
      FROM zyana.users WHERE email = $1
    `, [email.toLowerCase()])

    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' })

    const user = result.rows[0]
    if (!user.is_active) return res.status(403).json({ error: 'Account deactivated. Contact support.' })

    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) return res.status(401).json({ error: 'Invalid email or password' })

    await query('UPDATE zyana.users SET last_signed_in = NOW() WHERE id = $1', [user.id])

    const creditsResult = await query('SELECT balance, subscription_tier FROM zyana.user_credits WHERE user_id = $1', [user.id])
    const credits = creditsResult.rows[0] || { balance: 0, subscription_tier: 'free' }

    const token = generateToken(user.id)

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, brandName: user.brand_name, niche: user.niche, preferredModel: user.preferred_ai_model, aiProvider: user.ai_provider },
      credits: credits.balance,
      tier: credits.subscription_tier
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed. Please try again.' })
  }
})

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  const creditsResult = await query('SELECT balance, subscription_tier FROM zyana.user_credits WHERE user_id = $1', [req.user.id])
  const credits = creditsResult.rows[0] || { balance: 0, subscription_tier: 'free' }
  res.json({
    user: { id: req.user.id, email: req.user.email, name: req.user.name, brandName: req.user.brand_name, niche: req.user.niche, preferredModel: req.user.preferred_ai_model, aiProvider: req.user.ai_provider },
    credits: credits.balance,
    tier: credits.subscription_tier
  })
})

// PUT /api/auth/profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, brandName, niche, preferredModel, aiProvider } = req.body
    await query(`
      UPDATE zyana.users SET name=$1, brand_name=$2, niche=$3, preferred_ai_model=$4, ai_provider=$5, updated_at=NOW()
      WHERE id=$6
    `, [name || req.user.name, brandName || req.user.brand_name, niche || req.user.niche, preferredModel || req.user.preferred_ai_model, aiProvider || req.user.ai_provider, req.user.id])
    res.json({ message: 'Profile updated' })
  } catch (error) {
    res.status(500).json({ error: 'Update failed' })
  }
})

export default router
