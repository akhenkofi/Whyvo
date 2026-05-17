from app.api import routes
from app.core.config import settings


class DummyResponse:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def read(self):
        return b'{"sid":"SM123"}'


def test_ghana_sender_helper_uses_registered_sender(monkeypatch):
    monkeypatch.setattr(settings, 'TWILIO_FROM_NUMBER', '+17028422279')
    monkeypatch.setattr(settings, 'GHANA_TWILIO_SENDER_ID', 'SheepGhana')
    assert routes._twilio_from_for_destination('+233536761831') == 'SheepGhana'
    assert routes._twilio_from_for_destination('+15550000001') == '+17028422279'


def test_ghana_sender_helper_falls_back_to_twilio_number_when_no_sender_id(monkeypatch):
    monkeypatch.setattr(settings, 'TWILIO_FROM_NUMBER', '+17028422279')
    monkeypatch.setattr(settings, 'GHANA_TWILIO_SENDER_ID', '')
    assert routes._twilio_from_for_destination('+233536761831') == '+17028422279'


def test_send_otp_to_ghana_uses_registered_sender(monkeypatch):
    monkeypatch.setattr(settings, 'TWILIO_ACCOUNT_SID', 'AC_TEST')
    monkeypatch.setattr(settings, 'TWILIO_AUTH_TOKEN', 'token')
    monkeypatch.setattr(settings, 'TWILIO_FROM_NUMBER', '+17028422279')
    monkeypatch.setattr(settings, 'GHANA_TWILIO_SENDER_ID', 'SheepGhana')

    captured = {}

    def fake_urlopen(req, timeout=0):
        captured['full_url'] = req.full_url
        captured['data'] = req.data.decode('utf-8')
        captured['timeout'] = timeout
        return DummyResponse()

    monkeypatch.setattr(routes, 'urlopen', fake_urlopen)

    result = routes._send_otp('+233536761831', 'phone', '123456')
    assert result['sent'] is True
    assert 'From=SheepGhana' in captured['data']
    assert 'To=%2B233536761831' in captured['data']


def test_validate_twilio_sender_requires_sender(monkeypatch):
    monkeypatch.setattr(settings, 'TWILIO_FROM_NUMBER', '')
    monkeypatch.setattr(settings, 'GHANA_TWILIO_SENDER_ID', 'SheepGhana')
    assert routes._validate_twilio_sender_for_destination('+15550000001') == 'Twilio sender is not configured'
