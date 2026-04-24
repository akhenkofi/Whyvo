# Deploy FarmSavior to Your Domain (Vercel + Render)

## Target
- Frontend: `app.yourdomain.com` (Vercel)
- API: `api.yourdomain.com` (Render)

---

## 1) Push code to GitHub
```bash
cd /Users/akhen/Desktop/Openclaw/FarmSavior
git init
git add .
git commit -m "FarmSavior production baseline"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

## 2) Deploy backend on Render
1. Create new **Web Service** from your GitHub repo.
2. Root directory: `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add env vars:
   - `APP_NAME=FarmSavior API`
   - `SECRET_KEY=<strong-random-secret>`
   - `DATABASE_URL=<render-postgres-url-or-sqlite-path>`
6. Deploy and copy public URL (e.g. `https://farmsavior-api.onrender.com`)

## 3) Deploy frontend on Vercel
1. Import GitHub repo in Vercel.
2. Root directory: `web-admin`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Env var:
   - `VITE_API_BASE_URL=https://api.yourdomain.com/api/v1`
6. Deploy and copy URL.

## 4) Connect your domain (DNS)
In your DNS provider:
- `app` CNAME -> Vercel target
- `api` CNAME -> Render target (or A record per Render docs)

Wait for SSL issuance (usually automatic).

## 5) Verify
- `https://app.yourdomain.com`
- `https://api.yourdomain.com/docs`
- In browser network tab ensure API calls go to `api.yourdomain.com`.

## 6) Share safely
- Create test roles/accounts (farmer/admin)
- Add feedback button and issue tracker
- Monitor logs for 24h before broad sharing

---

## Instant update behavior
Any push to `main` can auto-deploy both frontend and backend. Team members using your domain get latest version without App Store updates.
