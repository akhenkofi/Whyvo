from app import main


class DummyDialect:
    def __init__(self, name):
        self.name = name


class DummyEngine:
    def __init__(self, name):
        self.dialect = DummyDialect(name)


def test_ts_type_uses_timestamp_for_postgres(monkeypatch):
    monkeypatch.setattr(main, 'engine', DummyEngine('postgresql'))
    assert main._ts_type() == 'TIMESTAMP'


def test_ts_type_uses_datetime_for_sqlite(monkeypatch):
    monkeypatch.setattr(main, 'engine', DummyEngine('sqlite'))
    assert main._ts_type() == 'DATETIME'
