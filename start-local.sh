#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
# Zyana Content Agent — Local Dev Startup
# Kills anything on ports 3001 & 5173, then starts both
# ─────────────────────────────────────────────────────────
set -e

BACKEND_PORT=3001
FRONTEND_PORT=5173

kill_port() {
  local port=$1
  local pids
  pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "  Killing PID(s) $pids on port $port..."
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 0.5
  else
    echo "  Port $port is free."
  fi
}

echo ""
echo "🔫 Clearing ports..."
kill_port $BACKEND_PORT
kill_port $FRONTEND_PORT

# Check backend .env exists
if [ ! -f "backend/.env" ]; then
  echo ""
  echo "⚠️  backend/.env not found — copying from .env.example"
  cp backend/.env.example backend/.env
  echo "   Fill in backend/.env before using payment or AI features."
fi

# Check frontend .env exists
if [ ! -f "frontend/.env" ]; then
  echo ""
  echo "⚠️  frontend/.env not found — copying from .env.example"
  cp frontend/.env.example frontend/.env
fi

echo ""
echo "📦 Installing dependencies (if needed)..."
(cd backend  && npm install --silent)
(cd frontend && npm install --silent)

echo ""
echo "🗄️  Running database migration..."
(cd backend && npm run migrate 2>&1) || echo "⚠️  Migration failed — check DATABASE_URL in backend/.env"

echo ""
echo "🚀 Starting servers..."
echo "   Backend  → http://localhost:$BACKEND_PORT"
echo "   Frontend → http://localhost:$FRONTEND_PORT"
echo ""

# Start backend in background, pipe logs with prefix
(cd backend && npm run dev 2>&1 | sed 's/^/[backend] /') &
BACKEND_PID=$!

# Give backend 2 seconds to boot
sleep 2

# Start frontend in foreground
(cd frontend && npm run dev 2>&1 | sed 's/^/[frontend] /') &
FRONTEND_PID=$!

# Trap Ctrl-C and kill both
trap "echo ''; echo '🛑 Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

echo "✅ Both servers running. Press Ctrl+C to stop."
echo ""

wait
