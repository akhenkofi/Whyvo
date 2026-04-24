# FarmSavior — Owner Relaunch Pack

This file is the minimal owner handoff so you can relaunch without OpenClaw.

## 1) What this app contains
- `backend/` FastAPI API
- `web-admin/` React/Vite frontend
- `mobile/` Flutter client (optional)
- `Start/Stop/Status FarmSavior.command` local launch scripts

## 2) Required runtime/env
Create `backend/.env` with at least:
- `APP_NAME`
- `SECRET_KEY`
- `DATABASE_URL` (SQLite or Postgres)
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `PAYSTACK_SECRET_KEY` (optional)
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` (optional)

Create `web-admin/.env`:
- `VITE_API_BASE_URL=https://<your-api-domain>/api/v1`

## 3) Local relaunch (no OpenClaw)
Backend:
1. `cd backend`
2. `python3 -m venv .venv && source .venv/bin/activate`
3. `pip install -r requirements.txt`
4. `uvicorn app.main:app --host 0.0.0.0 --port 8000`

Frontend:
1. `cd web-admin`
2. `npm install`
3. `npm run build` (or `npm run dev`)

## 4) Production relaunch checklist
1. Provision persistent DB (recommended Postgres).
2. Point backend `DATABASE_URL` to persistent DB.
3. Deploy backend.
4. Deploy frontend with correct `VITE_API_BASE_URL`.
5. Set domain/DNS.
6. Smoke test: signup, login, account delete, world chat, ID upload.

## 5) Current product behavior notes
- Prelaunch auth mode: signup + password login (OTP UI removed).
- ID verification requires uploaded images (no external image URLs).
- World chat now persists in runtime store across restarts.

## 6) Keep this folder self-owned
Always keep updated copies of:
- source code (`backend`, `web-admin`, `mobile`)
- env templates (`.env.example` style)
- this relaunch doc
- latest DB backup/migration notes
- domain/provider credentials in your own password manager (not in repo)
