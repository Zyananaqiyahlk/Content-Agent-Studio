import rateLimit from 'express-rate-limit'

export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many signup attempts. Please try again in an hour.' },
})

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = req.body?.email?.toLowerCase?.() || ''
    return email ? `login_${req.ip}_${email}` : `login_${req.ip}`
  },
  message: { error: 'Too many login attempts. Please wait.' },
})

export const billingCaptureLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many payment capture attempts. Please wait.' },
})
