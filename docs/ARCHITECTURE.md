# Architecture

## Overview
Three-tier MVP architecture:
1. **Mobile App (Flutter)** for field users.
2. **Web Admin (React + Vite)** for operations and monitoring.
3. **Backend API (FastAPI + SQLAlchemy)** as system-of-record.

## Backend
- Framework: FastAPI
- ORM: SQLAlchemy
- DB: SQLite default, PostgreSQL-ready via `DATABASE_URL`
- Auth: JWT (HS256), OTP mock verification
- API Prefix: `/api/v1`
- Docs: `/docs` (Swagger), `/redoc`

## Data Domains
- Users & Roles
- OTP codes
- Farmer profiles
- Crop listings & offers
- Logistics requests
- Payments (mobile money mock)
- Weather alerts

## Frontend
### Web Admin
- Vite + React
- Axios-based API service
- Dashboard cards + lightweight bar visuals

### Mobile
- Flutter scaffold
- Screens: Home, Register, Marketplace, Farm Passport, Weather Alerts
- HTTP API client for backend integration

## Scalability Notes (Phase 2)
- Extract services into microservices by domain (marketplace, logistics, payments)
- Event bus for alerts/payments/logistics state changes
- Redis cache and task queue
- Role-based access middleware + audit logs
