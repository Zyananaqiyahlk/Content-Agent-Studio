# How to Run — Zyana Content Agent

## Project structure (clean)

```
zyana-content-agent/
├── backend/          # Express API (port 3001)
│   ├── server.js     # Entry point
│   ├── migrate.js    # DB setup
│   ├── routes/       # API routes
│   ├── middleware/   # Auth, validation, rate limits
│   ├── services/     # AI router + providers
│   └── config/       # Database pool
├── frontend/         # React + Vite (port 5173)
│   └── src/
├── start-local.sh    # One-command local dev
├── railway.json      # Railway backend deploy config
└── package.json      # Root scripts (npm start)
```

## Prerequisites

- **Node.js 20+**
- **PostgreSQL** — Railway free tier, local Docker, or any Postgres 15+
- API keys: at least one AI provider (`CLAUDE_API_KEY` recommended)

### Option A — Local Postgres with Docker (easiest offline)

```bash
cd backend
docker compose up -d          # starts postgres on localhost:5432
```

Set in `backend/.env`:
```env
DATABASE_URL=postgresql://zyana_user:zyana_password_dev@localhost:5432/zyana_db
```

### Option B — Railway Postgres (cloud)

Copy `DATABASE_URL` from your Railway PostgreSQL plugin into `backend/.env`.

## First-time setup

```bash
cd zyana-content-agent

# 1. Copy env templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 2. Edit backend/.env — required:
#    DATABASE_URL=postgresql://...
#    JWT_SECRET=<64+ char hex — run command below>
#    CLAUDE_API_KEY=sk-ant-api03-...

# Generate a secure JWT secret:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 3. Install dependencies
npm run install:all
```

## Run locally (recommended)

```bash
npm start
# or
./start-local.sh
```

This will:
1. Free ports 3001 and 5173
2. Install deps if needed
3. Run `node migrate.js`
4. Start backend + frontend with hot reload

Open **http://localhost:5173** → Sign up → start generating.

## Run manually (two terminals)

**Terminal 1 — Backend:**
```bash
cd backend
npm install
npm run migrate    # once
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Verify it's working

```bash
# Health check
curl http://localhost:3001/health

# Backend load tests (server must be running)
npm run test:backend
```

## Deploy to Railway

See `RAILWAY_ENV_CHECKLIST.md` and `README.md` for full deploy steps.

After deploy:
```bash
npm run prelaunch -- https://your-backend.up.railway.app
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Port in use | `lsof -ti tcp:3001 \| xargs kill -9` (same for 5173) |
| DB connection failed | Check `DATABASE_URL` in `backend/.env` |
| JWT warning on start | Set `JWT_SECRET` to 64+ characters |
| AI calls fail | Add valid `CLAUDE_API_KEY` (or other provider key) |
| CORS errors | Ensure `FRONTEND_URL=http://localhost:5173` in backend `.env` |
