#!/bin/zsh
set -e
ROOT="/Users/akhen/Desktop/Openclaw/Whyvo"
RUN="$ROOT/.run"
mkdir -p "$RUN"

# Free required ports to avoid auto-switching (e.g., 5174)
for p in 8000 5173; do
  /usr/sbin/lsof -ti tcp:$p | xargs kill -9 2>/dev/null || true
done

# Backend
cd "$ROOT/backend"
if [ ! -d .venv ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
python3 -m pip install -q -r requirements.txt
[ -f .env ] || cp .env.example .env
python seeds/seed_data.py >/dev/null 2>&1 || true
nohup .venv/bin/python -m uvicorn app.main:app --reload --port 8000 > "$RUN/backend.log" 2>&1 &
echo $! > "$RUN/backend.pid"

# Web app
cd "$ROOT/web-admin"
[ -f .env ] || cp .env.example .env
[ -d node_modules ] || npm install
nohup npm run dev -- --port 5173 --host 0.0.0.0 > "$RUN/web.log" 2>&1 &
echo $! > "$RUN/web.pid"

sleep 3
open "http://127.0.0.1:5173" || true

echo "Whyvo started."
echo "Web: http://127.0.0.1:5173"
echo "API docs (manual): http://127.0.0.1:8000/docs"
