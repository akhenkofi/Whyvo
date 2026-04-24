# MVP Scope

## Included
- FastAPI backend with REST endpoints and OpenAPI docs.
- JWT token generation after OTP verification.
- SQLite dev mode; PostgreSQL-ready connection string support.
- Modules: Auth/OTP, Farmer Passport, Marketplace, Logistics, Payments (mock), Weather Alerts (mock), Admin Metrics.
- React web admin dashboard with KPI cards and basic charts.
- Flutter scaffold mobile app with key screens and API client.
- Seed data for GH/NG/BF samples.

## Excluded
- Production-grade OTP gateway integration
- Real-time GPS tracking map
- Payment reconciliation with PSPs
- Multi-tenant enterprise account controls
