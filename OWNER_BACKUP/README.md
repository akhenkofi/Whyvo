# FarmSavior FULL_OWNER_BACKUP

This folder is your owner-controlled relaunch pack.

## Included now
- `snapshots/farmsavior.db` (local DB snapshot if present)
- `snapshots/world-chat.json` (runtime world chat store if present)
- env templates (`backend.env.example`, `web-admin.env.example`) when available

## To recreate anywhere
1. Restore DB: place `farmsavior.db` in `backend/` (or import into Postgres if you migrate).
2. Restore runtime chat file to `backend/data/runtime/world-chat.json`.
3. Configure `backend/.env` and `web-admin/.env`.
4. Start backend + frontend using OWNER_RELAUNCH.md.

## Keep updated after every major change
- Replace DB snapshot with latest export.
- Copy latest runtime data files.
- Keep env templates current (no real secrets in repo).
- Keep this folder in Git.
