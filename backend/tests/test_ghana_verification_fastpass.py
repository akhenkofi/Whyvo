from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.api import routes


def make_verification(**overrides):
    base = dict(
        id=1,
        user_id=99,
        id_type='GhanaCard',
        id_number='GHA-123456789-0',
        id_photo_url='local:user-99/legacy.jpg',
        id_front_photo_url='local:user-99/front-a.jpg',
        id_back_photo_url='local:user-99/back-b.jpg',
        facial_verification_flag=False,
    )
    base.update(overrides)
    return SimpleNamespace(**base)


def test_ghana_card_fast_pass_recommendation_stays_pending():
    rec = make_verification(facial_verification_flag=True)
    status, score, reason = routes._ai_review_id_verification(rec)

    assert status == 'PENDING'
    assert score >= 0.86
    assert 'FAST_PASS_RECOMMENDED' in reason


def test_ghana_card_obvious_failure_auto_rejects():
    rec = make_verification(id_number='123', id_back_photo_url='')
    status, score, reason = routes._ai_review_id_verification(rec)

    assert status == 'DENIED'
    assert score < 0.86
    assert 'Ghana Card PIN must match' in reason
    assert 'Back Ghana Card image missing' in reason


def test_verification_analysis_requires_admin(monkeypatch):
    monkeypatch.setattr(routes, '_current_user_from_auth', lambda authorization, db: SimpleNamespace(id=2, role=routes.UserRole.farmer, phone='+233200000000'))

    with pytest.raises(HTTPException) as exc:
        routes.analyze_verification(1, 'Bearer token', db=None)

    assert exc.value.status_code == 403
    assert 'admin access required' in str(exc.value.detail).lower()
