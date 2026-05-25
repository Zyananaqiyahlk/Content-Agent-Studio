# Zyana Content Agent v1.1 — Setup Guide

## What You Got

A production-ready AI content studio SaaS with:

- Multi-AI provider (Claude, GPT-4o, Gemini, Llama)
- Credits-based billing via PayPal
- Script generator, AI chat, brand outreach, media kit
- Full PostgreSQL backend on Railway

## Quick Deploy (15 minutes)

### Step 1 — Railway Setup

1. Create account at [railway.app](https://railway.app)
2. New Project → Deploy from GitHub (or upload this repo)
3. Add PostgreSQL plugin (free tier available)
4. Add the backend service → set Dockerfile path: `backend/Dockerfile`
5. Add the frontend service → set Dockerfile path: `frontend/Dockerfile`

### Step 2 — Environment Variables

**Backend service — required:**

```
NODE_ENV=production
DATABASE_URL=[auto-filled by Railway PostgreSQL plugin]
JWT_SECRET=[run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"]
CLAUDE_API_KEY=sk-ant-api03-[your key from console.anthropic.com]
PAYPAL_CLIENT_ID=[from developer.paypal.com]
PAYPAL_CLIENT_SECRET=[from developer.paypal.com]
PAYPAL_MODE=sandbox
FRONTEND_URL=https://[your-frontend].up.railway.app
```

**Frontend service — required:**

```
VITE_API_URL=https://[your-backend].up.railway.app
```

### Step 3 — Run Migrations

Railway backend service → Shell tab → `node migrate.js`

### Step 4 — Verify

Hit your backend URL + `/health` — should return `{"status":"healthy"}`

### Step 5 — Go Live

1. Switch PAYPAL_MODE to `live` and update with live credentials
2. Set your own credit package prices in `backend/routes/billing.js`
3. Customize branding in `frontend/src/` — change "Content Agent Studio" to your brand

## Customization

- **Add your own brand:** Update `frontend/index.html` title, `frontend/src/pages/Login.jsx` logo
- **Change credit prices:** Edit `CREDIT_PACKAGES` in `backend/routes/billing.js`
- **Change free credits:** Set `FREE_CREDITS_ON_SIGNUP` in backend environment variables
- **Add social OAuth:** Add Google OAuth in `backend/routes/auth.js` (Passport.js recommended)

## License

[Include your license terms here — solo/agency/white-label tiers]

## Support

[Your support email or Discord]
