#!/usr/bin/env bash
set -e
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Backend
cd "$ROOT_DIR/backend"
python3 -m venv .venv || true
source .venv/bin/activate
pip install -r requirements.txt
cp -n .env.example .env || true
python -m app.main >/dev/null 2>&1 || true
python seeds/seed_data.py
uvicorn app.main:app --reload --port 8000 &
BACK_PID=$!

deactivate || true

# Web admin
cd "$ROOT_DIR/web-admin"
cp -n .env.example .env || true
npm install
npm run dev -- --port 5173 &
WEB_PID=$!

echo "Backend PID: $BACK_PID"
echo "Web Admin PID: $WEB_PID"
echo "API: http://127.0.0.1:8000/docs"
echo "Web: http://127.0.0.1:5173"
wait
