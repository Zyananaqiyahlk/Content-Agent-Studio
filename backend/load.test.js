import dotenv from 'dotenv'
dotenv.config()

const BASE_URL = process.env.TEST_URL || 'http://localhost:3001'
const CONCURRENT_USERS = 10

let passed = 0
let failed = 0

function log(emoji, test, detail = '') {
  console.log(`${emoji} ${test}${detail ? ': ' + detail : ''}`)
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

async function testHealthCheck() {
  console.log('\n📋 1. HEALTH CHECK')
  const { status, data, duration } = await apiCall('GET', '/health')
  assert(status === 200, 'Health endpoint responds', `${duration}ms`)
  assert(data.status === 'healthy', 'Database healthy', data.database?.status)
  assert(data.uptime >= 0, 'Server uptime tracked', `${data.uptime}s`)
  assert(duration < 1000, 'Health check fast', `${duration}ms < 1000ms`)
}

async function testSignup() {
  console.log('\n📋 2. USER SIGNUP')
  const email = `test_${Date.now()}@test.com`
  const { status, data, duration } = await apiCall('POST', '/api/auth/signup', {
    email, password: 'TestPass123!', name: 'Test User', brandName: 'Test Brand', niche: 'content_creation'
  })
  assert(status === 201, 'Signup returns 201', `${duration}ms`)
  assert(!!data.token, 'Token returned')
  assert(data.credits >= 10, 'Free credits given', `${data.credits} credits`)
  assert(!!data.user?.id, 'User ID returned')

  const dup = await apiCall('POST', '/api/auth/signup', { email, password: 'Test123!', name: 'Dup' })
  assert(dup.status === 409, 'Duplicate email rejected')

  const bad = await apiCall('POST', '/api/auth/signup', { email: 'notanemail', password: 'Test123!', name: 'Bad' })
  assert(bad.status === 400, 'Invalid email rejected')

  const short = await apiCall('POST', '/api/auth/signup', { email: `short_${Date.now()}@test.com`, password: '123', name: 'Short' })
  assert(short.status === 400, 'Short password rejected')

  return { token: data.token, email }
}

async function testLogin(email) {
  console.log('\n📋 3. LOGIN')
  const { status, data, duration } = await apiCall('POST', '/api/auth/login', { email, password: 'TestPass123!' })
  assert(status === 200, 'Login returns 200', `${duration}ms`)
  assert(!!data.token, 'Token returned on login')
  assert(typeof data.credits === 'number', 'Credits returned', `${data.credits}`)

  const wrong = await apiCall('POST', '/api/auth/login', { email, password: 'wrongpassword' })
  assert(wrong.status === 401, 'Wrong password rejected')

  const unknown = await apiCall('POST', '/api/auth/login', { email: 'nobody@test.com', password: 'pass' })
  assert(unknown.status === 401, 'Unknown email rejected')

  return data.token
}

async function testAuthProtection(token) {
  console.log('\n📋 4. AUTH PROTECTION')

  const noToken = await apiCall('GET', '/api/auth/me')
  assert(noToken.status === 401, 'No token → 401')

  const badToken = await apiCall('GET', '/api/auth/me', null, 'this.is.not.a.valid.jwt.token')
  assert(badToken.status === 401, 'Bad token → 401', `got ${badToken.status}`)

  const valid = await apiCall('GET', '/api/auth/me', null, token)
  assert(valid.status === 200, 'Valid token → 200', `got ${valid.status}`)
  assert(!!valid.data.user?.id, 'User data returned', valid.data.user?.email)
}

async function testCredits(token) {
  console.log('\n📋 5. CREDITS SYSTEM')
  const { status, data, duration } = await apiCall('GET', '/api/billing/balance', null, token)
  assert(status === 200, 'Balance endpoint works', `${duration}ms`)
  assert(typeof data.balance === 'number', 'Balance is number', `${data.balance} credits`)

  const packages = await apiCall('GET', '/api/billing/packages')
  assert(packages.status === 200, 'Packages endpoint works')
  assert(Array.isArray(packages.data) && packages.data.length >= 3, 'At least 3 credit packages')
  assert(packages.data.every(p => p.credits && p.priceUsd), 'All packages have credits + price')

  const history = await apiCall('GET', '/api/billing/history', null, token)
  assert(history.status === 200, 'Transaction history works')
  assert(Array.isArray(history.data), 'History is array')
}

async function testModels() {
  console.log('\n📋 6. AI MODELS')
  const { status, data, duration } = await apiCall('GET', '/api/models')
  assert(status === 200, 'Models endpoint works', `${duration}ms`)
  assert(Array.isArray(data) && data.length >= 4, 'At least 4 models available', `${data.length} models`)

  const providers = [...new Set(data.map(m => m.provider))]
  assert(providers.includes('anthropic'), 'Claude available')
  assert(providers.length >= 2, 'Multiple providers', providers.join(', '))

  const claude = await apiCall('GET', '/api/models/provider/anthropic')
  assert(claude.status === 200, 'Provider filter works', `got ${claude.status}`)
  assert(Array.isArray(claude.data), 'Provider filter returns array')
  assert(Array.isArray(claude.data) && claude.data.every(m => m.provider === 'anthropic'), 'Filter correct')
}

async function testConcurrentUsers() {
  console.log(`\n📋 7. CONCURRENT LOAD TEST (${CONCURRENT_USERS} simultaneous users)`)
  const start = Date.now()
  const promises = Array.from({ length: CONCURRENT_USERS }, (_, i) =>
    apiCall('POST', '/api/auth/signup', {
      email: `concurrent_${Date.now()}_${i}_${Math.random().toString(36).slice(2)}@test.com`,
      password: 'TestPass123!',
      name: `Load User ${i}`,
      brandName: `Brand ${i}`,
      niche: 'content_creation'
    })
  )
  const results = await Promise.all(promises)
  const duration = Date.now() - start
  const successful = results.filter(r => r.status === 201).length
  const avgTime = Math.round(results.reduce((s, r) => s + r.duration, 0) / results.length)

  assert(successful === CONCURRENT_USERS, `All ${CONCURRENT_USERS} signups succeed`, `${successful}/${CONCURRENT_USERS}`)
  assert(duration < 15000, 'All complete within 15 seconds', `${duration}ms`)
  assert(avgTime < 3000, 'Average response time OK', `${avgTime}ms avg`)
  console.log(`   ⏱  Total: ${duration}ms | Avg: ${avgTime}ms | Success: ${successful}/${CONCURRENT_USERS}`)
}

async function testRateLimiting() {
  console.log('\n📋 8. RATE LIMITING')
  const attempts = Array.from({ length: 12 }, () =>
    apiCall('POST', '/api/auth/login', { email: 'rate@test.com', password: 'wrong' })
  )
  const results = await Promise.all(attempts)
  const rateLimited = results.some(r => r.status === 429)
  assert(rateLimited, 'Rate limiting activates',
    rateLimited ? 'working' : `all returned ${[...new Set(results.map(r => r.status))].join(',')}`)
}

async function testErrorHandling() {
  console.log('\n📋 9. ERROR HANDLING')
  const notFound = await apiCall('GET', '/api/nonexistent')
  assert(notFound.status === 404, '404 for unknown routes', `got ${notFound.status}`)

  const noBody = await apiCall('POST', '/api/auth/login', {})
  assert(noBody.status === 400 || noBody.status === 401, 'Empty login body handled', `got ${noBody.status}`)
}

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
    await testConcurrentUsers()
    await testRateLimiting()
    await testErrorHandling()
  } catch (error) {
    log('💥', 'Test suite crashed', error.message)
    console.error(error)
    failed++
  }

  const total = passed + failed
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0

  console.log('\n═══════════════════════════════════════════')
  console.log(`  RESULTS: ${passed}/${total} passed (${pct}%)`)
  console.log(`  ✅ Passed: ${passed}  ❌ Failed: ${failed}`)
  if (pct >= 90)      console.log('  🎉 PRODUCTION READY — ship it!')
  else if (pct >= 75) console.log('  ⚠️  MOSTLY READY — fix failures above')
  else                console.log('  🚨 NOT READY — critical failures')
  console.log('═══════════════════════════════════════════\n')

  process.exit(failed > 0 ? 1 : 0)
}

runTests()
