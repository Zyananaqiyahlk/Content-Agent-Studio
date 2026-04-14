const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function getHeaders(auth = true) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = localStorage.getItem('token')
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

async function request(method, path, body, auth = true) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: getHeaders(auth),
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed')
    err.status = res.status
    err.code = data.code
    err.balance = data.balance
    err.needed = data.needed
    throw err
  }
  return data
}

export const api = {
  // Auth
  signup: (body) => request('POST', '/api/auth/signup', body, false),
  login: (body) => request('POST', '/api/auth/login', body, false),
  me: () => request('GET', '/api/auth/me'),
  updateProfile: (body) => request('PUT', '/api/auth/profile', body),

  // Agent
  chat: (body) => request('POST', '/api/agent/chat', body),
  generateScript: (body) => request('POST', '/api/agent/generate-script', body),
  outreachEmail: (body) => request('POST', '/api/agent/outreach-email', body),
  getScripts: () => request('GET', '/api/agent/scripts'),

  // Billing
  getPackages: () => request('GET', '/api/billing/packages', null, false),
  getBalance: () => request('GET', '/api/billing/balance'),
  createCheckout: (body) => request('POST', '/api/billing/create-checkout', body),
  getBillingHistory: () => request('GET', '/api/billing/history'),

  // Models
  getModels: () => request('GET', '/api/models'),
}
