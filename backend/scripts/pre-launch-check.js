#!/usr/bin/env node
/**
 * Pre-Launch Security & Functionality Check
 * Run: node backend/scripts/pre-launch-check.js https://your-backend.railway.app
 */
const BASE_URL = process.argv[2]
if (!BASE_URL) { console.error('Usage: node pre-launch-check.js <backend-url>'); process.exit(1) }

let passed = 0, failed = 0

async function check(name, fn) {
  try {
    const result = await fn()
    if (result.pass) {
      console.log(`✅ ${name}${result.note ? ': ' + result.note : ''}`)
      passed++
    } else {
      console.log(`❌ ${name}: ${result.reason}`)
      failed++
    }
  } catch (e) {
    console.log(`❌ ${name}: threw ${e.message}`)
    failed++
  }
}

async function api(method, path, body, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: res.status, data: await res.json().catch(() => ({})) }
}

;(async () => {
  console.log(`\n🔍 Pre-Launch Check: ${BASE_URL}\n`)

  await check('Health endpoint responds', async () => {
    const r = await api('GET', '/health')
    return { pass: r.status === 200 && r.data.status === 'healthy', reason: `Status: ${r.data.status}` }
  })

  await check('No localhost in CORS (production)', async () => {
    const res = await fetch(`${BASE_URL}/health`, { headers: { Origin: 'http://localhost:5173' } })
    const corsHeader = res.headers.get('access-control-allow-origin')
    const pass = !corsHeader || corsHeader !== 'http://localhost:5173'
    return { pass, reason: `CORS returned: ${corsHeader}` }
  })

  await check('Protected routes require auth', async () => {
    const r = await api('GET', '/api/auth/me')
    return { pass: r.status === 401, reason: `Got ${r.status}, expected 401` }
  })

  await check('SQL injection blocked in signup', async () => {
    const r = await api('POST', '/api/auth/signup', {
      email: "test'; DROP TABLE zyana.users; --@test.com",
      password: 'TestPass123!',
      name: 'Test'
    })
    return { pass: r.status === 400 || r.status === 409, reason: `Got ${r.status}, expected 400 or 409 (validation rejection)` }
  })

  await check('Login rate limiting active', async () => {
    const attempts = await Promise.all(
      Array.from({ length: 15 }, () => api('POST', '/api/auth/login', { email: 'rate@test.com', password: 'wrong' }))
    )
    const blocked = attempts.some(r => r.status === 429)
    return { pass: blocked, reason: blocked ? 'Rate limit triggered' : 'Rate limit NOT triggered after 15 attempts' }
  })

  await check('Error handler hides stack traces', async () => {
    const r = await api('GET', '/api/nonexistent-route-xyz')
    const hasStack = JSON.stringify(r.data).includes('at Object.')
    return { pass: !hasStack, reason: hasStack ? 'Stack trace leaked in response!' : 'Stack trace hidden' }
  })

  await check('Credit packages endpoint works', async () => {
    const r = await api('GET', '/api/billing/packages')
    return { pass: r.status === 200 && Array.isArray(r.data) && r.data.length >= 3, reason: `${r.data?.length || 0} packages` }
  })

  await check('AI models endpoint works', async () => {
    const r = await api('GET', '/api/models')
    return { pass: r.status === 200 && Array.isArray(r.data), note: `${r.data.length} models` }
  })

  await check('Signup gives free credits', async () => {
    const email = `prelaunch_${Date.now()}@test.com`
    const r = await api('POST', '/api/auth/signup', { email, password: 'TestPass123!', name: 'Launch Test' })
    return {
      pass: r.status === 201 && r.data.credits >= 1,
      note: `${r.data.credits} credits on signup`,
      reason: `Status ${r.status}, credits: ${r.data.credits}`
    }
  })

  console.log(`\n${'='.repeat(50)}`)
  console.log(`  RESULTS: ${passed}/${passed + failed} passed`)
  if (failed === 0) {
    console.log('  🚀 READY TO LAUNCH')
  } else {
    console.log(`  ⚠️  ${failed} check(s) failed — fix before going live`)
  }
  console.log(`${'='.repeat(50)}\n`)

  process.exit(failed > 0 ? 1 : 0)
})()
