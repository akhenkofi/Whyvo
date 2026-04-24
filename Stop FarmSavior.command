#!/bin/zsh
ROOT="/Users/akhen/Desktop/Openclaw/FarmSavior"
RUN="$ROOT/.run"

killfile(){
  f="$1"
  if [ -f "$f" ]; then
    pid=$(cat "$f")
    kill "$pid" 2>/dev/null || true
    rm -f "$f"
  fi
}

killfile "$RUN/web.pid"
killfile "$RUN/backend.pid"
pkill -f "uvicorn app.main:app --reload --port 8000" 2>/dev/null || true
pkill -f "vite --port 5173" 2>/dev/null || true

echo "FarmSavior stopped."
