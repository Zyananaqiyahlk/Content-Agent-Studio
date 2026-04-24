import { createRequire } from 'module'
import { connectDatabase, query } from './config/database.js'
import dotenv from 'dotenv'
dotenv.config()

async function migrate() {
  console.log('🔄 Running database migrations...')
  await connectDatabase()

  try {
    // Create schema
    await query(`CREATE SCHEMA IF NOT EXISTS zyana`)
    console.log('✅ Schema: zyana')

    // USERS
    await query(`
      CREATE TABLE IF NOT EXISTS zyana.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        brand_name VARCHAR(255) DEFAULT '',
        niche VARCHAR(255) DEFAULT 'content_creation',
        bio TEXT DEFAULT '',
        avatar_url VARCHAR(500) DEFAULT '',
        preferred_ai_model VARCHAR DEFAULT 'claude-sonnet-4-20250514',
        ai_provider VARCHAR DEFAULT 'anthropic',
        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_signed_in TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✅ Table: zyana.users')

    // CREDITS
    await query(`
      CREATE TABLE IF NOT EXISTS zyana.user_credits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES zyana.users(id) ON DELETE CASCADE,
        balance INT DEFAULT 0,
        total_purchased INT DEFAULT 0,
        total_used INT DEFAULT 0,
        subscription_tier VARCHAR DEFAULT 'free',
        subscription_expires_at TIMESTAMP,
        stripe_customer_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id)
      )
    `)
    console.log('✅ Table: zyana.user_credits')

    // USAGE LOGS
    await query(`
      CREATE TABLE IF NOT EXISTS zyana.usage_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES zyana.users(id) ON DELETE CASCADE,
        feature VARCHAR NOT NULL,
        model_name VARCHAR,
        provider VARCHAR,
        credits_used INT DEFAULT 0,
        tokens_used INT DEFAULT 0,
        cost_to_platform DECIMAL(10,6) DEFAULT 0,
        prompt_preview TEXT,
        success BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✅ Table: zyana.usage_logs')

    // TRANSACTIONS
    await query(`
      CREATE TABLE IF NOT EXISTS zyana.transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES zyana.users(id) ON DELETE CASCADE,
        type VARCHAR NOT NULL,
        amount_usd DECIMAL(10,2),
        credits_added INT DEFAULT 0,
        stripe_payment_intent_id VARCHAR(255),
        stripe_session_id VARCHAR(255),
        status VARCHAR DEFAULT 'pending',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✅ Table: zyana.transactions')

    // GENERATED SCRIPTS (persisted to DB)
    await query(`
      CREATE TABLE IF NOT EXISTS zyana.scripts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES zyana.users(id) ON DELETE CASCADE,
        topic TEXT NOT NULL,
        format VARCHAR(100),
        platform VARCHAR(100),
        audience VARCHAR(100),
        model_name VARCHAR,
        provider VARCHAR,
        content TEXT,
        credits_used INT DEFAULT 5,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✅ Table: zyana.scripts')

    // DOWNLOADS (track who downloaded what)
    await query(`
      CREATE TABLE IF NOT EXISTS zyana.downloads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES zyana.users(id) ON DELETE CASCADE,
        product_name VARCHAR(255),
        version VARCHAR(50),
        license_type VARCHAR(50),
        download_url TEXT,
        ip_address VARCHAR(50),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✅ Table: zyana.downloads')

    // AVAILABLE AI MODELS
    await query(`
      CREATE TABLE IF NOT EXISTS zyana.available_models (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        model_name VARCHAR UNIQUE NOT NULL,
        display_name VARCHAR NOT NULL,
        provider VARCHAR NOT NULL,
        cost_per_1k_input DECIMAL(10,6) DEFAULT 0,
        cost_per_1k_output DECIMAL(10,6) DEFAULT 0,
        max_tokens INT DEFAULT 4096,
        speed VARCHAR DEFAULT 'fast',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✅ Table: zyana.available_models')

    // INDEXES for performance
    await query(`CREATE INDEX IF NOT EXISTS idx_users_email ON zyana.users(email)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_credits_user ON zyana.user_credits(user_id)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_usage_user ON zyana.usage_logs(user_id)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_usage_created ON zyana.usage_logs(created_at)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_transactions_user ON zyana.transactions(user_id)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_scripts_user ON zyana.scripts(user_id)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_downloads_user ON zyana.downloads(user_id)`)
    console.log('✅ Indexes created')

    // SEED AI MODELS
    const models = [
      ['claude-sonnet-4-20250514', 'Claude Sonnet 4', 'anthropic', 0.003, 0.015, 8192, 'fast'],
      ['claude-haiku-4-5-20251001', 'Claude Haiku', 'anthropic', 0.00025, 0.00125, 4096, 'fastest'],
      ['gpt-4o', 'GPT-4o', 'openai', 0.005, 0.015, 4096, 'fast'],
      ['gpt-4o-mini', 'GPT-4o Mini', 'openai', 0.00015, 0.0006, 4096, 'fastest'],
      ['gemini-1.5-pro', 'Gemini 1.5 Pro', 'google', 0.0035, 0.0105, 8192, 'fast'],
      ['gemini-1.5-flash', 'Gemini Flash', 'google', 0.000075, 0.0003, 4096, 'fastest'],
      ['meta-llama/Llama-3-70b-chat-hf', 'Llama 3 70B', 'together', 0.0009, 0.0009, 4096, 'fast'],
    ]

    for (const [model_name, display_name, provider, cost_input, cost_output, max_tokens, speed] of models) {
      await query(`
        INSERT INTO zyana.available_models (model_name, display_name, provider, cost_per_1k_input, cost_per_1k_output, max_tokens, speed)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (model_name) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          cost_per_1k_input = EXCLUDED.cost_per_1k_input,
          is_active = true
      `, [model_name, display_name, provider, cost_input, cost_output, max_tokens, speed])
    }
    console.log('✅ AI models seeded (7 models)')

    console.log('\n🎉 Migration complete! Database ready.')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

migrate()
