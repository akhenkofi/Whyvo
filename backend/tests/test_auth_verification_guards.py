from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.api import routes


class DummyQuery:
    def __init__(self, rows):
        self.rows = rows

    def filter(self, *args, **kwargs):
        return self

    def all(self):
        return list(self.rows)

    def first(self):
        return self.rows[0] if self.rows else None


class DummyDB:
    def __init__(self, users=None):
        self.users = users or []

    def query(self, model):
        name = getattr(model, '__name__', '')
        if name == 'User':
            return DummyQuery(self.users)
        return DummyQuery([])


def make_user(**overrides):
    base = dict(
        id=1,
        phone='+15550000001',
        email='user@example.com',
        full_name='Test User',
        region='Accra',
        country='GH',
        role=routes.UserRole.farmer,
        hashed_password='hashed',
        is_verified=False,
        is_deleted=False,
    )
    base.update(overrides)
    return SimpleNamespace(**base)


def test_login_rejects_unverified_account(monkeypatch):
    user = make_user(is_verified=False)
    db = DummyDB(users=[user])

    monkeypatch.setattr(routes, '_find_existing_user_by_identity', lambda *args, **kwargs: user)
    monkeypatch.setattr(routes, '_phone_variants', lambda ident: [ident])
    monkeypatch.setattr(routes, 'verify_password', lambda plain, hashed: True)

    with pytest.raises(HTTPException) as exc:
        routes.login_user(SimpleNamespace(identifier='user@example.com', password='Pass1234!'), db)

    assert exc.value.status_code == 403
    assert 'not verified' in str(exc.value.detail).lower()


def test_login_allows_verified_account(monkeypatch):
    user = make_user(is_verified=True)
    db = DummyDB(users=[user])

    monkeypatch.setattr(routes, '_find_existing_user_by_identity', lambda *args, **kwargs: user)
    monkeypatch.setattr(routes, '_phone_variants', lambda ident: [ident])
    monkeypatch.setattr(routes, 'verify_password', lambda plain, hashed: True)
    monkeypatch.setattr(routes, '_account_store_upsert_user', lambda user: None)
    monkeypatch.setattr(routes, 'create_access_token', lambda subject, phone='', email='': 'token-123')

    result = routes.login_user(SimpleNamespace(identifier='user@example.com', password='Pass1234!'), db)
    assert result.access_token == 'token-123'


def test_register_reuses_unverified_email_and_resends_otp(monkeypatch):
    existing = make_user(id=7, is_verified=False, phone='TMP-123', email='user@example.com')

    committed = {'count': 0, 'added': []}

    class RegisterDB(DummyDB):
        def add(self, item):
            committed['added'].append(item)

        def commit(self):
            committed['count'] += 1

        def refresh(self, item):
            return item

    db = RegisterDB(users=[existing])

    monkeypatch.setattr(routes, '_find_existing_user_by_identity', lambda *args, **kwargs: existing)
    monkeypatch.setattr(routes, '_account_store_upsert_user', lambda user: None)
    monkeypatch.setattr(routes, 'hash_password', lambda password: f'hashed::{password}')
    monkeypatch.setattr(routes, '_send_otp', lambda destination, method, code: {'sent': True, 'channel': method})
    monkeypatch.setattr(routes.random, 'randint', lambda a, b: 123456)

    payload = SimpleNamespace(
        full_name='Updated Name',
        signup_method='email',
        phone=None,
        email='user@example.com',
        country='GH',
        region='Ashanti',
        user_type='Farmer',
        password='Pass1234!',
    )

    result = routes.register_user(payload, db)

    assert result['user_id'] == 7
    assert result['otp_destination'] == 'user@example.com'
    assert result['message'] == 'OTP resent'
    assert existing.full_name == 'Updated Name'
    assert existing.region == 'Ashanti'
    assert existing.is_verified is False
