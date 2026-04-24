#!/usr/bin/env python3
import json
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
EXPORT = DATA / 'exports' / 'json' / f"bundle_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"

payload = {
    'generated_at_utc': datetime.utcnow().isoformat() + 'Z',
    'sources': {}
}

for rel in [
    'raw/gov/programs_latest.json',
    'raw/weather/public_main_latest.json',
    'raw/market/spot_trading_latest.json',
]:
    p = DATA / rel
    if p.exists():
        payload['sources'][rel] = json.loads(p.read_text(encoding='utf-8'))

EXPORT.parent.mkdir(parents=True, exist_ok=True)
EXPORT.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding='utf-8')
print(str(EXPORT))
