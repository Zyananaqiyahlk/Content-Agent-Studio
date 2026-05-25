export function validateAgentInput(req, res, next) {
  const limits = {
    message: 2000,
    topic: 500,
    brandName: 100,
    brandNotes: 1000,
    audience: 200,
    brandCategory: 100,
    format: 100,
    platform: 100,
  }

  for (const [field, maxLen] of Object.entries(limits)) {
    if (req.body[field] && typeof req.body[field] !== 'string') {
      return res.status(400).json({ error: `${field} must be a string` })
    }
    if (req.body[field] && req.body[field].length > maxLen) {
      return res.status(400).json({ error: `${field} exceeds maximum length of ${maxLen} characters` })
    }
    if (req.body[field]) {
      req.body[field] = req.body[field].replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    }
  }

  next()
}
