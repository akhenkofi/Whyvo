# FarmSavior MVP+ (Upgraded)

FarmSavior now includes full visible web-admin flows for:
- Auth (Sign Up, Login, OTP Verify + JWT localStorage protection)
- User onboarding (ID Verification + Digital Farm Passport)
- Marketplace (Crop + Livestock)
- Services (Logistics, Equipment Rentals, Storage Reservations)
- Payments + Escrow
- Weather Alerts
- Cross-border Trade Contracts
- Enhanced Admin Dashboard (sidebar, KPI cards, filterable tables)

## Stack
- Backend: FastAPI + SQLAlchemy + JWT + SQLite
- Web Admin: React (Vite)

## Quick Start (macOS one-click)
- Double click: `Start FarmSavior.command`
- Check status: `Status FarmSavior.command`
- Stop: `Stop FarmSavior.command`

Or via shell:
```bash
chmod +x scripts/start_all.sh
./scripts/start_all.sh
```

## URLs
- Web admin: http://127.0.0.1:5173
- API docs: http://127.0.0.1:8000/docs

## First Click Flow (after start)
1. Open web admin.
2. On auth screen choose **SIGNUP**.
3. Register with required fields:
   - full_name, phone, country (GH/NG/BF), region, user_type, password
4. App shows mock OTP in response message.
5. Go to **OTP** tab, verify phone + code.
6. You enter dashboard and can use sidebar modules.

## Seed Users (password: `Pass1234!`)
- Farmer (GH): `+233200000001`
- Buyer (NG): `+234800000001`
- Transporter (BF): `+226700000001`
- Equipment Provider (GH): `+233200000002`
- Storage Provider (NG): `+234800000002`

## Notes
- Seed script rebuilds DB schema to include new modules.
- Mock uploads are URL fields (id_photo_url, farm_photo_urls).
- Existing legacy endpoints are preserved where practical (`/logistics/requests`, `/payments/mobile-money/mock`).
