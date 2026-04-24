#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SNAP="$ROOT/OWNER_BACKUP/snapshots"
mkdir -p "$SNAP"

[ -f "$ROOT/backend/farmsavior.db" ] && cp "$ROOT/backend/farmsavior.db" "$SNAP/farmsavior.db"
[ -f "$ROOT/backend/data/runtime/world-chat.json" ] && cp "$ROOT/backend/data/runtime/world-chat.json" "$SNAP/world-chat.json" || true
[ -f "$ROOT/backend/.env.example" ] && cp "$ROOT/backend/.env.example" "$SNAP/backend.env.example" || true
[ -f "$ROOT/web-admin/.env.example" ] && cp "$ROOT/web-admin/.env.example" "$SNAP/web-admin.env.example" || true

echo "FarmSavior OWNER_BACKUP refreshed."
