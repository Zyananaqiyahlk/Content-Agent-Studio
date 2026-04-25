# Zyana Content Agent

AI-powered content studio for creators — generate scripts, write outreach emails, and chat with your personal AI agent. Credits-based system with PayPal checkout.

## Features

- **Script Generator** — AI video scripts (Hook / Body / CTA) for any niche, format, and platform
- **AI Agent Chat** — Conversational AI with voice input and TTS playback
- **Brand Outreach** — Personalized UGC partnership emails + brand pipeline tracker
- **Multi-model** — Claude, GPT-4o, Gemini, Llama 3 via a single dropdown
- **Credits system** — Pay-as-you-go with PayPal, 25 free credits on signup
- **Dashboard** — Follower goal tracker + daily task checklist

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + React Router |
| Backend | Node.js + Express |
| Database | PostgreSQL (Railway) |
| Auth | JWT (30-day tokens) |
| AI | Anthropic Claude, OpenAI, Google Gemini, Together AI (Llama) |
| Payments | PayPal Checkout (REST API v2) |

---

## Quick Start (Local)

### Prerequisites

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **PostgreSQL database** — Railway free tier, or Docker locally
- **Git**

### 1 — Clone & configure

```bash
git clone https://github.com/YOUR_USERNAME/zyana-content-agent_user.git
cd zyana-content-agent_user

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Fill in `backend/.env` — see the [Environment Variables](#environment-variables) section.

### 2 — Start everything with one command

```bash
./start-local.sh
```

This script:
- Kills any process already on ports **3001** and **5173**
- Installs npm dependencies in both folders
- Runs database migrations
- Starts backend (`:3001`) and frontend (`:5173`) with live reload

Open [http://localhost:5173](http://localhost:5173), sign up, and start generating.

### Manual start (if you prefer separate terminals)

**Kill ports first:**

```bash
lsof -ti tcp:3001 | xargs kill -9 2>/dev/null; true
lsof -ti tcp:5173 | xargs kill -9 2>/dev/null; true
```

**Backend:**

```bash
cd backend
npm install
npm run migrate    # run once to create DB tables
npm run dev        # starts with file-watch reload
```

**Frontend (new tab):**

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
# ── Database ──────────────────────────────────
DATABASE_URL=postgresql://user:password@host:port/database

# ── Server ────────────────────────────────────
NODE_ENV=development          # development | production
PORT=3001
FRONTEND_URL=http://localhost:5173

# ── Auth ──────────────────────────────────────
# Generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<64-char random hex string>

# ── AI Providers (need at least one) ──────────
CLAUDE_API_KEY=sk-ant-api03-...      # console.anthropic.com
OPENAI_API_KEY=sk-...                # optional
GOOGLE_API_KEY=AIza...               # optional
TOGETHER_API_KEY=...                 # optional

# ── PayPal ────────────────────────────────────
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_MODE=sandbox                  # sandbox | live

# ── Rate Limiting ─────────────────────────────
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# ── Credits (defaults shown) ──────────────────
FREE_CREDITS_ON_SIGNUP=25
CREDITS_PER_SCRIPT=5
CREDITS_PER_CHAT=3
CREDITS_PER_EMAIL=5
CREDITS_PER_MEDIAKIT=10
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3001
# Production: VITE_API_URL=https://your-backend.railway.app
```

---

## PayPal Setup

### Sandbox (testing)

1. Go to [developer.paypal.com](https://developer.paypal.com) → sign in.
2. **My Apps & Credentials** → **Create App** → name it `Zyana`, type: Merchant.
3. Copy **Client ID** and **Secret** into `backend/.env`:
   ```env
   PAYPAL_CLIENT_ID=AYour_sandbox_client_id
   PAYPAL_CLIENT_SECRET=EYour_sandbox_secret
   PAYPAL_MODE=sandbox
   ```
4. Test payments using the sandbox buyer accounts listed under your app.

### Going live

Switch to the **Live** tab of the same PayPal app, copy the live credentials, and set:

```env
PAYPAL_CLIENT_ID=<live id>
PAYPAL_CLIENT_SECRET=<live secret>
PAYPAL_MODE=live
```

### Payment flow

```
User clicks "Buy with PayPal"
  → Backend creates a PayPal Order, returns approval URL
  → User redirected to PayPal to log in and confirm payment
  → PayPal redirects back to /credits?payment=pending&token=ORDER_ID
  → Frontend automatically calls POST /api/billing/capture-paypal
  → Backend captures the order → credits added to account
  → Success message + balance updates
```

---

## Deploying to Railway

### Backend

1. Push code to GitHub.
2. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**.
3. Railway auto-uses `railway.json` + `backend/Dockerfile`.
4. Add **Variables** (all backend env vars above):
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://your-frontend.up.railway.app`
   - `PAYPAL_MODE=live` (when ready)
5. Run migration once: Railway service → **Shell** → `node migrate.js`.

### Frontend

1. Same Railway project → **New Service** → **Deploy from GitHub** (same repo).
2. Service settings → **Build** → Dockerfile path: `frontend/Dockerfile`.
3. Add variable: `VITE_API_URL=https://your-backend.up.railway.app`.
4. Deploy — served via nginx on port 80.

### Database

Add the Railway PostgreSQL plugin → copy the `DATABASE_URL` it generates into your backend service variables.

---

## Credits System

Every user gets **25 free credits** on signup. Credits are consumed per AI operation:

| Feature | Credits |
|---------|---------|
| Script generation | 5 |
| Chat message | 3 |
| Outreach email | 5 |
| Media kit | 10 |

### Credit packages (PayPal)

| Package | Credits | Price |
|---------|---------|-------|
| Starter Pack | 100 | $5 |
| Creator Pack | 500 | $20 |
| Agency Pack | 2,000 | $60 |

To change prices, edit the `CREDIT_PACKAGES` array in [`backend/routes/billing.js`](backend/routes/billing.js).  
To change credit costs per feature, edit the `CREDITS_PER_*` values in `backend/.env`.

---

## API Reference

All routes are prefixed `/api`. Protected routes require `Authorization: Bearer <token>`.

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | No | Create account + get token |
| POST | `/api/auth/login` | No | Login + get token |
| GET | `/api/auth/me` | Yes | Current user |
| PUT | `/api/auth/profile` | Yes | Update profile |

### Agent (AI generation)

| Method | Path | Auth | Credits | Description |
|--------|------|------|---------|-------------|
| POST | `/api/agent/chat` | Yes | 3 | Chat with AI agent |
| POST | `/api/agent/generate-script` | Yes | 5 | Generate video script |
| POST | `/api/agent/outreach-email` | Yes | 5 | Write outreach email |
| GET | `/api/agent/scripts` | Yes | — | List saved scripts |

### Billing

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/billing/packages` | No | List credit packages |
| GET | `/api/billing/balance` | Yes | Credit balance + totals |
| POST | `/api/billing/create-checkout` | Yes | Create PayPal order → `{ orderId, url }` |
| POST | `/api/billing/capture-paypal` | Yes | Capture PayPal payment → adds credits |
| GET | `/api/billing/history` | Yes | Last 20 transactions |

### Other

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/models` | No | Available AI models |
| GET | `/health` | No | Server + DB health check |

---

## Troubleshooting

**Port already in use**
```bash
lsof -ti tcp:3001 | xargs kill -9
lsof -ti tcp:5173 | xargs kill -9
```

**Database connection failed** — Check `DATABASE_URL` in `backend/.env`. Make sure your Railway PostgreSQL service is running and the connection string is correct.

**PayPal "not configured" error** — Make sure both `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are set. `PAYPAL_MODE` must match the credentials type (`sandbox` or `live`).

**AI calls failing** — At least one AI key (`CLAUDE_API_KEY`, `OPENAI_API_KEY`, etc.) must be valid and have quota.

**Credits not updating after payment** — The capture happens automatically when PayPal redirects back. If it fails, check the browser console for errors from `/api/billing/capture-paypal`. Make sure `FRONTEND_URL` in the backend exactly matches where the frontend is hosted.
