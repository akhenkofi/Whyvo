#!/bin/zsh
ROOT="/Users/akhen/Desktop/Openclaw/FarmSavior"
RUN="$ROOT/.run"

check(){
  name="$1"; file="$2"
  if [ -f "$file" ]; then
    pid=$(cat "$file")
    if ps -p "$pid" >/dev/null 2>&1; then
      echo "$name: running (PID $pid)"
    else
      echo "$name: not running (stale pid file)"
    fi
  else
    echo "$name: not running"
  fi
}

check "Backend" "$RUN/backend.pid"
check "Web" "$RUN/web.pid"
echo "Web: http://127.0.0.1:5173"
echo "API docs: http://127.0.0.1:8000/docs"
