# FarmSavior Data Lake

This folder stores high-value operational and analytics data.

## Structure

- `raw/events/` API request/event logs (JSONL)
- `raw/gov/` government programs snapshots and history
- `raw/weather/` weather snapshots and history
- `raw/market/` spot-trading snapshots and history
- `processed/cleaned/` normalized cleaned datasets
- `processed/features/` ML/analytics feature tables
- `warehouse/` denormalized query-ready datasets
- `exports/csv|json|pdf/` shareable outputs
- `reports/` periodic insight reports
- `models/` model artifacts and metadata

## File formats

- **JSONL** for append-only event streams (`*.jsonl`)
- **JSON** for latest snapshots (`*_latest.json`)
- **CSV** for external analysis and BI tools
- **PDF** for executive briefs

## Data policy

- Never overwrite event history JSONL files.
- Snapshots (`*_latest.json`) are overwrite-safe and represent latest state.
- Add retention rules before production (e.g., 180 days raw logs).
- Avoid storing secrets or full PII in analytics files.
