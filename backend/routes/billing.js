import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { query } from '../config/database.js'

const router = express.Router()

const PAYPAL_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

// Credit packages
const CREDIT_PACKAGES = [
  { id: 'starter', name: 'Starter Pack',  credits: 100,  priceUsd: 5  },
  { id: 'creator', name: 'Creator Pack',  credits: 500,  priceUsd: 20, popular: true },
  { id: 'agency',  name: 'Agency Pack',   credits: 2000, priceUsd: 60 },
]

// ─── PayPal helpers ────────────────────────────────────────

async function getPayPalToken() {
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('PayPal auth failed: ' + JSON.stringify(data))
  return data.access_token
}

async function createPayPalOrder(pkg, userId, accessToken) {
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        custom_id: JSON.stringify({ userId, packageId: pkg.id, credits: pkg.credits }),
        description: `${pkg.name} — ${pkg.credits} AI Credits`,
        amount: { currency_code: 'USD', value: pkg.priceUsd.toFixed(2) },
      }],
      application_context: {
        brand_name: 'Zyana AI',
        user_action: 'PAY_NOW',
        return_url: `${process.env.FRONTEND_URL}/credits?payment=pending`,
        cancel_url: `${process.env.FRONTEND_URL}/credits?payment=cancelled`,
      },
    }),
  })
  return res.json()
}

async function capturePayPalOrder(orderId, accessToken) {
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
  return res.json()
}

// ─── Routes ────────────────────────────────────────────────

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

// POST /api/billing/create-checkout  →  returns PayPal approval URL
router.post('/create-checkout', authenticate, async (req, res) => {
  try {
    const { packageId } = req.body
    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId)
    if (!pkg) return res.status(400).json({ error: 'Invalid package' })

    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      return res.status(503).json({ error: 'PayPal not configured on this server' })
    }

    const accessToken = await getPayPalToken()
    const order = await createPayPalOrder(pkg, req.user.id, accessToken)

    if (order.error || !order.id) {
      console.error('PayPal order error:', order)
      return res.status(500).json({ error: 'Failed to create PayPal order' })
    }

    // Record pending transaction
    await query(`
      INSERT INTO zyana.transactions (user_id, type, amount_usd, credits_added, paypal_order_id, status, metadata)
      VALUES ($1, 'credit_purchase', $2, $3, $4, 'pending', $5)
    `, [req.user.id, pkg.priceUsd, pkg.credits, order.id,
        JSON.stringify({ packageId: pkg.id, packageName: pkg.name })])

    // Find the approval URL PayPal returns
    const approvalUrl = order.links?.find(l => l.rel === 'approve')?.href
    res.json({ orderId: order.id, url: approvalUrl })
  } catch (error) {
    console.error('Checkout error:', error)
    res.status(500).json({ error: error.message || 'Checkout failed' })
  }
})

// POST /api/billing/capture-paypal  →  called after user approves on PayPal
router.post('/capture-paypal', authenticate, async (req, res) => {
  try {
    const { token } = req.body   // PayPal sends ?token=ORDER_ID in the return URL
    if (!token) return res.status(400).json({ error: 'Missing PayPal order token' })

    // Find the pending transaction for this order
    const txResult = await query(
      'SELECT * FROM zyana.transactions WHERE paypal_order_id = $1',
      [token]
    )
    const pendingTx = txResult.rows[0]
    if (!pendingTx) return res.status(404).json({ error: 'Order not found' })
    if (pendingTx.user_id !== req.user.id) return res.status(403).json({ error: 'Order does not belong to this user' })
    if (pendingTx.status === 'completed') {
      return res.json({ success: true, credits: pendingTx.credits_added, already_processed: true })
    }

    const accessToken = await getPayPalToken()
    const capture = await capturePayPalOrder(token, accessToken)

    if (capture.status !== 'COMPLETED') {
      console.error('PayPal capture not completed:', capture)
      return res.status(400).json({ error: 'Payment not completed', status: capture.status })
    }

    const credits = pendingTx.credits_added

    // Add credits to user
    await query(`
      UPDATE zyana.user_credits
      SET balance = balance + $1, total_purchased = total_purchased + $1, updated_at = NOW()
      WHERE user_id = $2
    `, [credits, req.user.id])

    // Mark transaction completed
    await query(`
      UPDATE zyana.transactions SET status = 'completed', updated_at = NOW()
      WHERE paypal_order_id = $1
    `, [token])

    console.log(`✅ PayPal payment confirmed: user ${req.user.id} +${credits} credits ($${pendingTx.amount_usd})`)
    res.json({ success: true, credits })
  } catch (error) {
    console.error('PayPal capture error:', error)
    res.status(500).json({ error: error.message || 'Capture failed' })
  }
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
