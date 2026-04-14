import jwt from 'jsonwebtoken'
import { query } from '../config/database.js'

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Verify user still exists and is active
    const result = await query(
      'SELECT id, email, name, brand_name, niche, preferred_ai_model, ai_provider, is_active FROM zyana.users WHERE id = $1',
      [decoded.userId]
    )

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return res.status(401).json({ error: 'Account not found or deactivated' })
    }

    req.user = { ...decoded, ...result.rows[0] }
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' })
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' })
    }
    console.error('Auth error:', error)
    res.status(500).json({ error: 'Authentication failed' })
  }
}

export function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' })
}
