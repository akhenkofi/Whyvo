from datetime import datetime, timedelta

from app.api import routes
from app.models.models import SheepGoatSubscription


def _sub(status, *, plan_code='premium', reference='SGSUB-1', created_at=None):
    return SheepGoatSubscription(
        user_id=1,
        plan_code=plan_code,
        country='GH',
        billing_cycle='monthly',
        amount=10.0,
        currency='GHS',
        status=status,
        reference=reference,
        created_at=created_at or datetime.utcnow(),
        started_at=datetime.utcnow(),
        ends_at=datetime.utcnow() + timedelta(days=30),
    )


def test_select_best_subscription_prefers_active_over_newer_pending():
    newer_pending = _sub('PENDING_PAYMENT', reference='SGSUB-NEW', created_at=datetime(2026, 4, 1, 12, 0, 0))
    older_active = _sub('ACTIVE', reference='SGSUB-OLD', created_at=datetime(2026, 3, 31, 12, 0, 0))

    winner = routes._select_best_subscription_record([newer_pending, older_active])

    assert winner.reference == 'SGSUB-OLD'
    assert winner.status == 'ACTIVE'


def test_livestock_access_context_keeps_trial_as_premium(monkeypatch):
    trial = _sub('TRIAL_ACTIVE', reference='SGSUB-TRIAL')
    monkeypatch.setattr(routes, '_livestock_active_subscription_for_user', lambda user_id, db: trial)

    ctx = routes._livestock_access_context(1, db=None)

    assert ctx['tier'] == 'premium'
    assert ctx['status'] == 'TRIAL_ACTIVE'
    assert ctx['can_create_records'] is True
    assert ctx['record_limit'] is None
