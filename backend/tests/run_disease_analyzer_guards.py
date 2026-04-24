from types import SimpleNamespace

from app.api import routes


class HealthyDB:
    def add(self, item):
        self.item = item
    def commit(self):
        pass
    def refresh(self, item):
        item.id = 123
    def rollback(self):
        pass


class FailingSaveDB:
    def add(self, item):
        self.item = item
    def commit(self):
        raise RuntimeError('db write failed')
    def refresh(self, item):
        pass
    def rollback(self):
        self.rolled_back = True


def assert_true(condition, message):
    if not condition:
        raise AssertionError(message)


def run():
    # Known-sign cases should return the expected primary diagnosis.
    cases = [
        ('goat-ppr', 'PPR', SimpleNamespace(user_id=1, image_url='uploaded-image://goat-mouth-lesions.jpg', crop_type='goat', context_note='mouth sores nasal discharge diarrhea high fever')),
        ('sheep-footrot', 'Foot Rot', SimpleNamespace(user_id=1, image_url='uploaded-image://sheep-hoof.jpg', crop_type='sheep', context_note='limping hoof smell interdigital foot rot')),
        ('cattle-mastitis', 'Mastitis', SimpleNamespace(user_id=1, image_url='uploaded-image://cow-udder.jpg', crop_type='cattle', context_note='udder swelling hot udder clots in milk')),
        ('poultry-cocci', 'Coccidiosis', SimpleNamespace(user_id=1, image_url='uploaded-image://chicken-droppings.jpg', crop_type='poultry', context_note='bloody droppings diarrhea poor growth')),
    ]

    for label, expected, payload in cases:
        res = routes.ai_disease_analyze(payload, HealthyDB())
        assert_true(expected.lower() in str(res.get('diagnosis', '')).lower(), f'{label}: expected primary diagnosis {expected}, got {res.get("diagnosis")}')
        assert_true(bool(res.get('top_matches')), f'{label}: expected top_matches to be present')

    # Even if scan persistence fails, the analyzer must still return a result.
    payload = SimpleNamespace(user_id=1, image_url='uploaded-image://goat-mouth-lesions.jpg', crop_type='goat', context_note='mouth sores nasal discharge diarrhea high fever')
    failing_db = FailingSaveDB()
    res = routes.ai_disease_analyze(payload, failing_db)
    assert_true('PPR'.lower() in str(res.get('diagnosis', '')).lower(), 'analyzer should still return a diagnosis when scan save fails')
    assert_true(res.get('scan_id') is None, 'scan_id should be None when save fails')

    print('PASS: disease analyzer guards locked in')


if __name__ == '__main__':
    run()
