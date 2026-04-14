# Content Agent Studio

AI-powered content creation and brand growth platform. Generate video scripts, chat with an AI agent, write brand outreach emails, and track your progress — all in one place.

## Features

- **Script Generator** — AI video scripts (Hook / Body / CTA) for any niche, format, and platform
- **AI Agent Chat** — Conversational AI with voice input (SpeechRecognition) and TTS playback
- **Brand Outreach** — Personalized UGC partnership emails + brand pipeline tracker
- **Multi-model** — Claude, GPT-4o, Gemini, Llama 3 via a single dropdown
- **Credits system** — Pay-as-you-go with Stripe, 25 free credits on signup
- **Dashboard** — Follower goal tracker + daily task checklist

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + React Router |
| Backend | Node.js + Express |
| Database | PostgreSQL (Railway) |
| Auth | JWT (30-day tokens) |
| AI | Anthropic Claude, OpenAI, Google Gemini, Together AI (Llama) |
| Payments | Stripe Checkout |

## Quick start

### 1. Backend

```bash
cd backend
cp .env.example .env   # fill in your keys
npm install
npm run migrate        # creates the DB schema
npm start              # runs on :3001
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env   # set VITE_API_URL if needed
npm install
npm run dev            # runs on :5173
```

### 3. Open

Navigate to `http://localhost:5173`, sign up (get 25 free credits), and start generating.

## Environment variables

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql://...
JWT_SECRET=<random 64-byte hex>
CLAUDE_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AIza...
TOGETHER_API_KEY=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:5173
PORT=3001
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3001
```

## Credit costs

| Feature | Credits |
|---------|---------|
| Script generation | 5 |
| AI chat message | 3 |
| Outreach email | 5 |
| Signup bonus | 25 free |

## API routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | — | Create account |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/auth/me` | ✓ | Current user |
| PUT | `/api/auth/profile` | ✓ | Update profile |
| POST | `/api/agent/chat` | ✓ | AI chat (3 credits) |
| POST | `/api/agent/generate-script` | ✓ | Script gen (5 credits) |
| POST | `/api/agent/outreach-email` | ✓ | Email gen (5 credits) |
| GET | `/api/agent/scripts` | ✓ | Saved scripts |
| GET | `/api/billing/packages` | — | Credit packages |
| GET | `/api/billing/balance` | ✓ | Credit balance |
| POST | `/api/billing/create-checkout` | ✓ | Stripe checkout |
| GET | `/api/billing/history` | ✓ | Transactions |
| GET | `/api/models` | — | Available models |
