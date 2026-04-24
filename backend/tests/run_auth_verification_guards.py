from types import SimpleNamespace

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
        self.added = []
        self.commits = 0

    def query(self, model):
        name = getattr(model, '__name__', '')
        if name == 'User':
            return DummyQuery(self.users)
        return DummyQuery([])

    def add(self, item):
        self.added.append(item)

    def commit(self):
        self.commits += 1

    def refresh(self, item):
        return item


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


def assert_true(condition, message):
    if not condition:
        raise AssertionError(message)


def run():
    original_find = routes._find_existing_user_by_identity
    original_phone_variants = routes._phone_variants
    original_verify_password = routes.verify_password
    original_account_store = routes._account_store_upsert_user
    original_create_access_token = routes.create_access_token
    original_hash_password = routes.hash_password
    original_send_otp = routes._send_otp
    original_randint = routes.random.randint

    try:
        # Unverified login must be blocked.
        user = make_user(is_verified=False)
        db = DummyDB(users=[user])
        routes._find_existing_user_by_identity = lambda *args, **kwargs: user
        routes._phone_variants = lambda ident: [ident]
        routes.verify_password = lambda plain, hashed: True
        blocked = False
        try:
            routes.login_user(SimpleNamespace(identifier='user@example.com', password='Pass1234!'), db)
        except HTTPException as exc:
            blocked = exc.status_code == 403 and 'not verified' in str(exc.detail).lower()
        assert_true(blocked, 'unverified login was not blocked')

        # Verified login must still work.
        user2 = make_user(id=2, is_verified=True)
        db2 = DummyDB(users=[user2])
        routes._find_existing_user_by_identity = lambda *args, **kwargs: user2
        routes._account_store_upsert_user = lambda user: None
        routes.create_access_token = lambda subject, phone='', email='': 'token-123'
        result = routes.login_user(SimpleNamespace(identifier='user@example.com', password='Pass1234!'), db2)
        assert_true(result.access_token == 'token-123', 'verified login token was not returned')

        # Re-registering an unverified email should resend OTP instead of hard-failing.
        existing = make_user(id=7, is_verified=False, phone='TMP-123', email='user@example.com')
        db3 = DummyDB(users=[existing])
        routes._find_existing_user_by_identity = lambda *args, **kwargs: existing
        routes.hash_password = lambda password: f'hashed::{password}'
        routes._send_otp = lambda destination, method, code: {'sent': True, 'channel': method}
        routes.random.randint = lambda a, b: 123456

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
        res = routes.register_user(payload, db3)
        assert_true(res['user_id'] == 7, 'existing unverified account was not reused')
        assert_true(res['message'] == 'OTP resent', 'unverified signup did not resend OTP')
        assert_true(existing.full_name == 'Updated Name', 'existing user details were not updated')
        print('PASS: auth verification guards locked in')
    finally:
        routes._find_existing_user_by_identity = original_find
        routes._phone_variants = original_phone_variants
        routes.verify_password = original_verify_password
        routes._account_store_upsert_user = original_account_store
        routes.create_access_token = original_create_access_token
        routes.hash_password = original_hash_password
        routes._send_otp = original_send_otp
        routes.random.randint = original_randint


if __name__ == '__main__':
    run()
