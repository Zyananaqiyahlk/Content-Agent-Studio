import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const { Pool } = pg

// Connection pool — handles concurrent users efficiently
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Pool settings for production load
  max: 20,                 // max 20 concurrent DB connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

pool.on('error', (err) => {
  console.error('Unexpected DB client error:', err)
})

pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('📦 New DB connection established')
  }
})

export async function connectDatabase() {
  try {
    const client = await pool.connect()
    const result = await client.query('SELECT NOW() as time, version() as version')
    console.log('✅ Database connected:', result.rows[0].time)
    console.log('📊 PostgreSQL:', result.rows[0].version.split(' ')[1])
    client.release()
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    process.exit(1)
  }
}

export async function query(text, params) {
  const start = Date.now()
  try {
    const result = await pool.query(text, params)
    const duration = Date.now() - start
    if (duration > 1000) {
      console.warn(`⚠️ Slow query (${duration}ms):`, text.substring(0, 100))
    }
    return result
  } catch (error) {
    console.error('DB Query error:', { text: text.substring(0, 100), error: error.message })
    throw error
  }
}

export async function getClient() {
  return pool.connect()
}

export async function checkHealth() {
  try {
    const result = await pool.query('SELECT 1 as ok')
    return { status: 'healthy', connections: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount }
  } catch (error) {
    return { status: 'unhealthy', error: error.message }
  }
}

export default pool
