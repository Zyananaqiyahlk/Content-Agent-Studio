import express from 'express'
import Stripe from 'stripe'
import { authenticate } from '../middleware/auth.js'
import { query } from '../config/database.js'

const router = express.Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder')

// Credit packages
const CREDIT_PACKAGES = [
  { id: 'starter', name: 'Starter Pack', credits: 100, priceUsd: 5, stripePriceId: null },
  { id: 'creator', name: 'Creator Pack', credits: 500, priceUsd: 20, stripePriceId: null, popular: true },
  { id: 'agency', name: 'Agency Pack', credits: 2000, priceUsd: 60, stripePriceId: null },
]

// GET /api/billing/packages
router.get('/packages', (req, res) => {
  res.json(CREDIT_PACKAGES)
})

// GET /api/billing/balance
router.get('/balance', authenticate, async (req, res) => {
  const result = await query(
    'SELECT balance, total_purchased, total_used, subscription_tier, subscription_expires_at FROM zyana.user_credits WHERE user_id = $1',
    [req.user.id]
  )
  res.json(result.rows[0] || { balance: 0, total_purchased: 0, total_used: 0, subscription_tier: 'free' })
})

// POST /api/billing/create-checkout
router.post('/create-checkout', authenticate, async (req, res) => {
  try {
    const { packageId, successUrl, cancelUrl } = req.body
    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId)
    if (!pkg) return res.status(400).json({ error: 'Invalid package' })

    // Get or create Stripe customer
    let stripeCustomerId = null
    const creditsResult = await query('SELECT stripe_customer_id FROM zyana.user_credits WHERE user_id = $1', [req.user.id])
    stripeCustomerId = creditsResult.rows[0]?.stripe_customer_id

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.name,
        metadata: { userId: req.user.id, brandName: req.user.brand_name }
      })
      stripeCustomerId = customer.id
      await query('UPDATE zyana.user_credits SET stripe_customer_id = $1 WHERE user_id = $2', [stripeCustomerId, req.user.id])
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${pkg.name} — ${pkg.credits} Credits`,
            description: `${pkg.credits} AI generation credits for ${req.user.brand_name || req.user.name}`,
            metadata: { packageId: pkg.id, credits: pkg.credits.toString() }
          },
          unit_amount: pkg.priceUsd * 100,
        },
        quantity: 1,
      }],
      metadata: { userId: req.user.id, packageId: pkg.id, credits: pkg.credits.toString() },
      success_url: successUrl || `${process.env.FRONTEND_URL}/dashboard?payment=success&credits=${pkg.credits}`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/credits?payment=cancelled`,
    })

    // Record pending transaction
    await query(`
      INSERT INTO zyana.transactions (user_id, type, amount_usd, credits_added, stripe_session_id, status, metadata)
      VALUES ($1, 'credit_purchase', $2, $3, $4, 'pending', $5)
    `, [req.user.id, pkg.priceUsd, pkg.credits, session.id, JSON.stringify({ packageId: pkg.id, packageName: pkg.name })])

    res.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    res.status(500).json({ error: error.message || 'Checkout failed' })
  }
})

// POST /api/billing/webhook — Stripe webhook (raw body)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder')
  } catch (error) {
    console.error('Webhook signature failed:', error.message)
    return res.status(400).send(`Webhook Error: ${error.message}`)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const { userId, credits, packageId } = session.metadata

    try {
      // Add credits to user
      await query(`
        UPDATE zyana.user_credits
        SET balance = balance + $1, total_purchased = total_purchased + $1, updated_at = NOW()
        WHERE user_id = $2
      `, [parseInt(credits), userId])

      // Update transaction status
      await query(`
        UPDATE zyana.transactions SET status = 'completed', updated_at = NOW()
        WHERE stripe_session_id = $1
      `, [session.id])

      console.log(`✅ Payment confirmed: user ${userId} +${credits} credits ($${session.amount_total / 100})`)
    } catch (error) {
      console.error('Webhook processing error:', error)
      return res.status(500).send('Processing failed')
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object
    await query(`UPDATE zyana.transactions SET status = 'failed', updated_at = NOW() WHERE stripe_payment_intent_id = $1`, [pi.id]).catch(() => {})
  }

  res.json({ received: true })
})

// GET /api/billing/history
router.get('/history', authenticate, async (req, res) => {
  const result = await query(`
    SELECT type, amount_usd, credits_added, status, metadata, created_at
    FROM zyana.transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20
  `, [req.user.id])
  res.json(result.rows)
})

export default router
