import json
from datetime import datetime
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parents[3]  # FarmSavior/
DATA_DIR = BASE_DIR / 'data'


def _ensure(path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def write_jsonl(relative_path: str, record: dict[str, Any]) -> None:
    p = _ensure(DATA_DIR / relative_path)
    payload = {
        'ts_utc': datetime.utcnow().isoformat() + 'Z',
        **record,
    }
    with p.open('a', encoding='utf-8') as f:
        f.write(json.dumps(payload, ensure_ascii=False) + '\n')


def write_snapshot(relative_path: str, payload: Any) -> None:
    p = _ensure(DATA_DIR / relative_path)
    with p.open('w', encoding='utf-8') as f:
        json.dump({'updated_at_utc': datetime.utcnow().isoformat() + 'Z', 'data': payload}, f, ensure_ascii=False, indent=2)
