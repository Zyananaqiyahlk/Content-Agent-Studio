import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { connectDatabase, checkHealth } from './config/database.js'
import authRoutes from './routes/auth.js'
import agentRoutes from './routes/agent.js'
import billingRoutes from './routes/billing.js'
import modelsRoutes from './routes/models.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// ─── SECURITY MIDDLEWARE ───────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}))

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Rate limiting — protects against abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                    // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait 15 minutes.' }
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,                     // 10 auth attempts per 15 min
  message: { error: 'Too many login attempts. Please wait.' }
})

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,         // 1 minute
  max: 20,                     // 20 AI calls per minute per IP
  message: { error: 'AI rate limit hit. Wait 1 minute.' }
})

// ─── BODY PARSING ──────────────────────────────────────────
// Webhook needs raw body — MUST come before express.json()
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── REQUEST LOGGING ───────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    const emoji = res.statusCode >= 400 ? '❌' : '✅'
    if (req.path !== '/health') {
      console.log(`${emoji} ${req.method} ${req.path} ${res.statusCode} ${duration}ms`)
    }
  })
  next()
})

// ─── ROUTES ────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/agent', apiLimiter, aiLimiter, agentRoutes)
app.use('/api/billing', billingRoutes)
app.use('/api/models', modelsRoutes)

// ─── HEALTH CHECK (Railway uses this) ──────────────────────
app.get('/health', async (req, res) => {
  const dbHealth = await checkHealth()
  const status = dbHealth.status === 'healthy' ? 200 : 503
  res.status(status).json({
    status: dbHealth.status,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: '1.0.0',
    database: dbHealth,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
    }
  })
})

// ─── ERROR HANDLER ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error', message: process.env.NODE_ENV === 'development' ? err.message : undefined })
})

// ─── 404 HANDLER ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
})

// ─── START ─────────────────────────────────────────────────
await connectDatabase()

app.listen(PORT, () => {
  console.log(`\n🚀 Zyana SaaS Backend running on port ${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`)
  console.log(`💳 Stripe: ${process.env.STRIPE_SECRET_KEY ? '✅ configured' : '⚠️  not configured'}`)
  console.log(`🤖 Claude: ${process.env.CLAUDE_API_KEY ? '✅ configured' : '⚠️  not configured'}`)
  console.log(`\n📍 Health check: http://localhost:${PORT}/health\n`)
})

export default app
