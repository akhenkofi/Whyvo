# Whyvo

Whyvo is a focused communication app built from an isolated copy of FarmSavior's reusable messaging and calling foundation.

Current goal:
- direct messaging
- audio calls
- video calls
- incoming call handling
- clean, simple communication-first product experience

## Status
This codebase is intentionally being separated from FarmSavior.

That means:
- new GitHub repo for Whyvo
- new Vercel project for Whyvo
- new Railway project for Whyvo
- new env vars and domains for Whyvo only
- no shared deploy credentials or inherited API targets

## Local app paths
- Web app: `web-admin`
- Backend API: `backend`
- Mobile app: `mobile`

## Quick Start (macOS)
- Double click: `Start Whyvo.command`
- Check status: `Status Whyvo.command`
- Stop: `Stop Whyvo.command`

Or via shell:
```bash
chmod +x scripts/start_all.sh
./scripts/start_all.sh
```

## Local URLs
- Web app: http://127.0.0.1:5173
- API docs: http://127.0.0.1:8000/docs

## Notes
- This repo is a working extraction base, not a finished Whyvo release.
- FarmSavior should remain untouched.
- Whyvo infrastructure must remain fully separate from FarmSavior and StayHia.
