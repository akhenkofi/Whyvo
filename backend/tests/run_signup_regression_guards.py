from urllib.parse import parse_qs

from app.api import routes
from app.core.config import settings
from app import main


class DummyResponse:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def read(self):
        return b'{"sid":"SM123"}'


class DummyDialect:
    def __init__(self, name):
        self.name = name


class DummyEngine:
    def __init__(self, name):
        self.dialect = DummyDialect(name)


def assert_true(condition, message):
    if not condition:
        raise AssertionError(message)


def run():
    original_urlopen = routes.urlopen
    original_sid = settings.TWILIO_ACCOUNT_SID
    original_token = settings.TWILIO_AUTH_TOKEN
    original_from = settings.TWILIO_FROM_NUMBER
    original_gh_sender = settings.GHANA_TWILIO_SENDER_ID
    original_engine = main.engine

    try:
        settings.TWILIO_ACCOUNT_SID = 'AC_TEST'
        settings.TWILIO_AUTH_TOKEN = 'token'
        settings.TWILIO_FROM_NUMBER = '+17028422279'
        settings.GHANA_TWILIO_SENDER_ID = 'SheepGhana'

        captured = {}

        def fake_urlopen(req, timeout=0):
            captured['full_url'] = req.full_url
            captured['body'] = parse_qs(req.data.decode('utf-8'))
            captured['timeout'] = timeout
            return DummyResponse()

        routes.urlopen = fake_urlopen

        sender = routes._twilio_from_for_destination('+233536761831')
        assert_true(sender == 'SheepGhana', 'Ghana sender ID did not resolve to SheepGhana')

        result = routes._send_otp('+233536761831', 'phone', '123456')
        assert_true(result['sent'] is True, 'Ghana OTP send path did not report success')
        assert_true(captured['body'].get('From') == ['SheepGhana'], 'Twilio From sender was not SheepGhana')

        main.engine = DummyEngine('postgresql')
        assert_true(main._ts_type() == 'TIMESTAMP', 'Postgres runtime bootstrap is not using TIMESTAMP')

        main.engine = DummyEngine('sqlite')
        assert_true(main._ts_type() == 'DATETIME', 'SQLite runtime bootstrap changed unexpectedly')

        print('PASS: signup regression guards locked in')
    finally:
        routes.urlopen = original_urlopen
        settings.TWILIO_ACCOUNT_SID = original_sid
        settings.TWILIO_AUTH_TOKEN = original_token
        settings.TWILIO_FROM_NUMBER = original_from
        settings.GHANA_TWILIO_SENDER_ID = original_gh_sender
        main.engine = original_engine


if __name__ == '__main__':
    run()
