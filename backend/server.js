import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { connectDatabase, checkHealth } from './config/database.js'
import authRoutes from './routes/auth.js'
import agentRoutes from './routes/agent.js'
import billingRoutes from './routes/billing.js'
import modelsRoutes from './routes/models.js'
import platformsRoutes from './routes/platforms.js'
import studioRoutes from './routes/studio.js'
import metaRoutes from './routes/meta.js'
import scheduleRoutes from './routes/schedule.js'
import { log } from './utils/log.js'

dotenv.config()

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 64) {
  const msg = 'JWT_SECRET must be at least 64 characters'
  if (process.env.NODE_ENV === 'production') {
    console.error(`❌ ${msg}`)
    process.exit(1)
  }
  console.warn(`⚠️  ${msg} — use: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
}

const app = express()
const PORT = process.env.PORT || 3001

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL].filter(Boolean)
  : [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
    ]

// ─── SECURITY MIDDLEWARE ───────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", process.env.FRONTEND_URL].filter(Boolean),
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  } : false,
}))

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS blocked: ${origin}`))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait 15 minutes.' },
})

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  keyGenerator: (req) => {
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const decoded = jwt.decode(authHeader.split(' ')[1])
        if (decoded?.userId) return `ai_user_${decoded.userId}`
      } catch {}
    }
    return `ai_ip_${req.ip}`
  },
  message: { error: 'Too many AI requests. Please wait 1 minute.' },
})

// ─── BODY PARSING ──────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── REQUEST LOGGING (dev only) ────────────────────────────
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    if (req.path !== '/health' && process.env.NODE_ENV !== 'production') {
      const duration = Date.now() - start
      const emoji = res.statusCode >= 400 ? '❌' : '✅'
      log(`${emoji} ${req.method} ${req.path} ${res.statusCode} ${duration}ms`)
    }
  })
  next()
})

// ─── ROUTES ────────────────────────────────────────────────
app.use('/api/auth', apiLimiter, authRoutes)
app.use('/api/agent', apiLimiter, aiLimiter, agentRoutes)
app.use('/api/billing', apiLimiter, billingRoutes)
app.use('/api/models', apiLimiter, modelsRoutes)
app.use('/api/platforms', apiLimiter, platformsRoutes)
app.use('/api/studio', apiLimiter, studioRoutes)
app.use('/api/meta', apiLimiter, metaRoutes)
app.use('/api/schedule', apiLimiter, scheduleRoutes)

// ─── HEALTH CHECK (Railway uses this) ──────────────────────
app.get('/health', async (req, res) => {
  const dbHealth = await checkHealth()
  const status = dbHealth.status === 'healthy' ? 200 : 503
  res.status(status).json({
    status: dbHealth.status,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    ...(process.env.NODE_ENV === 'development' && {
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
      },
      database: dbHealth,
    }),
  })
})

// ─── ERROR HANDLER ─────────────────────────────────────────
app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development'

  console.error('Unhandled error:', {
    message: err.message,
    stack: isDev ? err.stack : '[hidden in production]',
    path: req.path,
    method: req.method,
  })

  const status = err.status || 500
  res.status(status).json({
    error: isDev ? err.message : 'Internal server error',
    ...(isDev && { stack: err.stack }),
  })
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
  log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`)
  console.log(`💳 PayPal: ${process.env.PAYPAL_CLIENT_ID ? `✅ configured (${process.env.PAYPAL_MODE || 'sandbox'})` : '⚠️  not configured'}`)
  console.log(`🤖 Claude: ${process.env.CLAUDE_API_KEY ? '✅ configured' : '⚠️  not configured'}`)
  log(`📍 Health check: http://localhost:${PORT}/health\n`)
})

export default app
