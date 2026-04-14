/**
 * ZYANA SAAS — LOAD & PRODUCTION TEST
 * Tests: signup, login, credits, AI calls, concurrent users
 * Run: node tests/load.test.js
 */

import dotenv from 'dotenv'
dotenv.config()

const BASE_URL = process.env.TEST_URL || 'http://localhost:3001'
const CONCURRENT_USERS = 10
const TEST_EMAIL_PREFIX = `test_${Date.now()}`

let passed = 0
let failed = 0
const results = []

function log(emoji, test, detail = '') {
  const line = `${emoji} ${test}${detail ? ': ' + detail : ''}`
  console.log(line)
  results.push(line)
}

async function apiCall(method, path, body, token) {
  const start = Date.now()
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    })
    const data = await res.json().catch(() => ({}))
    return { status: res.status, data, duration: Date.now() - start }
  } catch (error) {
    return { status: 0, data: { error: error.message }, duration: Date.now() - start }
  }
}

function assert(condition, testName, detail) {
  if (condition) { log('✅', testName, detail); passed++ }
  else { log('❌', testName, detail); failed++ }
}

// ─── TEST SUITE ────────────────────────────────────────────

async function testHealthCheck() {
  console.log('\n📋 1. HEALTH CHECK')
  const { status, data, duration } = await apiCall('GET', '/health')
  assert(status === 200, 'Health endpoint responds', `${duration}ms`)
  assert(data.status === 'healthy', 'Database healthy', data.database?.status)
  assert(data.uptime >= 0, 'Server uptime tracked', `${data.uptime}s`)
  assert(duration < 500, 'Health check fast', `${duration}ms < 500ms`)
  return data
}

async function testSignup() {
  console.log('\n📋 2. USER SIGNUP')
  const email = `${TEST_EMAIL_PREFIX}@test.com`

  // Valid signup
  const { status, data, duration } = await apiCall('POST', '/api/auth/signup', {
    email, password: 'TestPass123!', name: 'Test User', brandName: 'Test Brand', niche: 'content_creation'
  })
  assert(status === 201, 'Signup returns 201', `${duration}ms`)
  assert(!!data.token, 'Token returned')
  assert(data.credits >= 10, 'Free credits given', `${data.credits} credits`)
  assert(!!data.user?.id, 'User ID returned')

  // Duplicate email
  const dup = await apiCall('POST', '/api/auth/signup', { email, password: 'Test123!', name: 'Dup' })
  assert(dup.status === 409, 'Duplicate email rejected')

  // Invalid email
  const bad = await apiCall('POST', '/api/auth/signup', { email: 'notanemail', password: 'Test123!', name: 'Bad' })
  assert(bad.status === 400, 'Invalid email rejected')

  // Short password
  const short = await apiCall('POST', '/api/auth/signup', { email: `short@test.com`, password: '123', name: 'Short' })
  assert(short.status === 400, 'Short password rejected')

  return { token: data.token, userId: data.user?.id, email }
}

async function testLogin(email) {
  console.log('\n📋 3. LOGIN')

  // Valid login
  const { status, data, duration } = await apiCall('POST', '/api/auth/login', {
    email, password: 'TestPass123!'
  })
  assert(status === 200, 'Login returns 200', `${duration}ms`)
  assert(!!data.token, 'Token returned on login')
  assert(typeof data.credits === 'number', 'Credits returned', `${data.credits}`)

  // Wrong password
  const wrong = await apiCall('POST', '/api/auth/login', { email, password: 'wrongpassword' })
  assert(wrong.status === 401, 'Wrong password rejected')

  // Unknown email
  const unknown = await apiCall('POST', '/api/auth/login', { email: 'nobody@test.com', password: 'pass' })
  assert(unknown.status === 401, 'Unknown email rejected')

  return data.token
}

async function testAuthProtection(token) {
  console.log('\n📋 4. AUTH PROTECTION')

  // No token
  const noToken = await apiCall('GET', '/api/auth/me')
  assert(noToken.status === 401, 'No token → 401')

  // Bad token
  const badToken = await apiCall('GET', '/api/auth/me', null, 'bad.token.here')
  assert(badToken.status === 401, 'Bad token → 401')

  // Valid token
  const valid = await apiCall('GET', '/api/auth/me', null, token)
  assert(valid.status === 200, 'Valid token → 200')
  assert(!!valid.data.user?.id, 'User data returned')
}

async function testCredits(token) {
  console.log('\n📋 5. CREDITS SYSTEM')

  const { status, data, duration } = await apiCall('GET', '/api/billing/balance', null, token)
  assert(status === 200, 'Balance endpoint works', `${duration}ms`)
  assert(typeof data.balance === 'number', 'Balance is number', `${data.balance} credits`)

  const packages = await apiCall('GET', '/api/billing/packages')
  assert(packages.status === 200, 'Packages endpoint works')
  assert(packages.data.length >= 3, 'At least 3 credit packages', `${packages.data.length} packages`)
  assert(packages.data.every(p => p.credits && p.priceUsd), 'All packages have credits + price')

  const history = await apiCall('GET', '/api/billing/history', null, token)
  assert(history.status === 200, 'Transaction history works')
  assert(Array.isArray(history.data), 'History is array')
}

async function testModels() {
  console.log('\n📋 6. AI MODELS')

  const { status, data, duration } = await apiCall('GET', '/api/models')
  assert(status === 200, 'Models endpoint works', `${duration}ms`)
  assert(data.length >= 4, 'At least 4 models available', `${data.length} models`)

  const providers = [...new Set(data.map(m => m.provider))]
  assert(providers.includes('anthropic'), 'Claude available')
  assert(providers.includes('openai') || providers.length >= 2, 'Multiple providers')

  const claude = await apiCall('GET', '/api/models/provider/anthropic')
  assert(claude.status === 200, 'Provider filter works')
  assert(claude.data.every(m => m.provider === 'anthropic'), 'Filter correct')
}

async function testScriptGeneration(token) {
  console.log('\n📋 7. SCRIPT GENERATION (requires credits + AI key)')

  const balance = await apiCall('GET', '/api/billing/balance', null, token)
  const credits = balance.data?.balance || 0

  if (credits < 5) {
    log('⚠️', 'Script gen skipped', `Only ${credits} credits (need 5)`)
    return
  }

  if (!process.env.CLAUDE_API_KEY || process.env.CLAUDE_API_KEY.includes('your-key')) {
    log('⚠️', 'Script gen skipped', 'No AI API key configured')
    return
  }

  const { status, data, duration } = await apiCall('POST', '/api/agent/generate-script', {
    topic: 'Test: AI automation saves small businesses time',
    format: 'Talking Head',
    platform: 'TikTok',
    audience: 'Small business owners'
  }, token)

  assert(status === 200, 'Script generated successfully', `${duration}ms`)
  assert(!!data.script, 'Script content returned')
  assert(data.script.length > 200, 'Script has substance', `${data.script.length} chars`)
  assert(typeof data.creditsUsed === 'number', 'Credits deducted', `${data.creditsUsed} credits`)
  assert(data.script.includes('HOOK') || data.script.includes('Hook'), 'Script has HOOK section')
}

async function testConcurrentUsers() {
  console.log(`\n📋 8. CONCURRENT LOAD TEST (${CONCURRENT_USERS} simultaneous users)`)

  const start = Date.now()
  const promises = Array.from({ length: CONCURRENT_USERS }, (_, i) =>
    apiCall('POST', '/api/auth/signup', {
      email: `concurrent_${Date.now()}_${i}@test.com`,
      password: 'TestPass123!',
      name: `Concurrent User ${i}`,
      brandName: `Brand ${i}`,
      niche: 'content_creation'
    })
  )

  const results = await Promise.all(promises)
  const duration = Date.now() - start
  const successful = results.filter(r => r.status === 201).length
  const avgTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length

  assert(successful === CONCURRENT_USERS, `All ${CONCURRENT_USERS} signups succeed`, `${successful}/${CONCURRENT_USERS}`)
  assert(duration < 10000, 'All complete within 10 seconds', `${duration}ms total`)
  assert(avgTime < 2000, 'Average response time OK', `${Math.round(avgTime)}ms avg`)

  console.log(`   ⏱️  Total: ${duration}ms | Avg per user: ${Math.round(avgTime)}ms | Success: ${successful}/${CONCURRENT_USERS}`)
}

async function testRateLimiting() {
  console.log('\n📋 9. RATE LIMITING')

  // Hit auth endpoint 12 times rapidly
  const attempts = []
  for (let i = 0; i < 12; i++) {
    attempts.push(apiCall('POST', '/api/auth/login', { email: 'rate@test.com', password: 'wrong' }))
  }
  const results = await Promise.all(attempts)
  const rateLimited = results.some(r => r.status === 429)
  assert(rateLimited, 'Rate limiting activates after too many requests')
}

async function testMissingRoutes() {
  console.log('\n📋 10. ERROR HANDLING')

  const notFound = await apiCall('GET', '/api/nonexistent')
  assert(notFound.status === 404, '404 for unknown routes')

  const badMethod = await apiCall('DELETE', '/api/auth/login')
  assert(badMethod.status === 404 || badMethod.status === 405, 'Bad method handled')
}

// ─── RUN ALL TESTS ─────────────────────────────────────────
async function runTests() {
  console.log('═══════════════════════════════════════════')
  console.log('  ZYANA SAAS — PRODUCTION READINESS TEST  ')
  console.log('═══════════════════════════════════════════')
  console.log(`🎯 Target: ${BASE_URL}`)
  console.log(`🕐 Started: ${new Date().toLocaleTimeString()}`)

  try {
    await testHealthCheck()
    const { token: signupToken, email } = await testSignup()
    const loginToken = await testLogin(email)
    await testAuthProtection(loginToken)
    await testCredits(loginToken)
    await testModels()
    await testScriptGeneration(loginToken)
    await testConcurrentUsers()
    await testRateLimiting()
    await testMissingRoutes()
  } catch (error) {
    log('💥', 'Test suite crashed', error.message)
    failed++
  }

  const total = passed + failed
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0

  console.log('\n═══════════════════════════════════════════')
  console.log(`  RESULTS: ${passed}/${total} passed (${pct}%)`)
  console.log(`  ✅ Passed: ${passed}  ❌ Failed: ${failed}`)
  if (pct >= 90) console.log('  🎉 PRODUCTION READY!')
  else if (pct >= 70) console.log('  ⚠️  MOSTLY READY — fix failures above')
  else console.log('  🚨 NOT READY — critical failures')
  console.log('═══════════════════════════════════════════\n')

  process.exit(failed > 0 ? 1 : 0)
}

runTests()
