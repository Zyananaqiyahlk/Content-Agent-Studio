# Railway Environment Variables — Required Before Launch

## Backend Service Variables

### Database
- [ ] DATABASE_URL — copy from Railway PostgreSQL plugin (auto-generated)

### Server
- [ ] NODE_ENV=production
- [ ] PORT=3001
- [ ] FRONTEND_URL=https://[your-frontend-service].up.railway.app

### Auth
- [ ] JWT_SECRET — generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
  MUST be 64+ characters. Never reuse between environments.

### AI Providers (at least one required)
- [ ] CLAUDE_API_KEY — from console.anthropic.com
- [ ] OPENAI_API_KEY — optional
- [ ] GOOGLE_API_KEY — optional
- [ ] TOGETHER_API_KEY — optional

### PayPal (switch to LIVE before charging real money)
- [ ] PAYPAL_CLIENT_ID — from developer.paypal.com (LIVE tab)
- [ ] PAYPAL_CLIENT_SECRET — from developer.paypal.com (LIVE tab)
- [ ] PAYPAL_MODE=live

### Rate Limiting
- [ ] RATE_LIMIT_WINDOW_MS=900000
- [ ] RATE_LIMIT_MAX=100

### Credits
- [ ] FREE_CREDITS_ON_SIGNUP=25
- [ ] CREDITS_PER_SCRIPT=5
- [ ] CREDITS_PER_CHAT=3
- [ ] CREDITS_PER_EMAIL=5
- [ ] CREDITS_PER_MEDIAKIT=10

## Frontend Service Variables
- [ ] VITE_API_URL=https://[your-backend-service].up.railway.app

## Post-Deploy Steps
1. Run migration: Railway backend service → Shell → `node migrate.js`
2. Hit /health endpoint and confirm: `{ "status": "healthy" }`
3. Test PayPal sandbox payment end-to-end before switching to live
4. Verify CORS: frontend can hit backend without browser errors
