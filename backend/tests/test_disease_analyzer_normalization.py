import pytest

from app.api.routes import normalize_livestock_target


@pytest.mark.parametrize(
    ('raw_target', 'expected'),
    [
        ('Sheep', 'sheep'),
        (' sheep ', 'sheep'),
        ('RAM', 'sheep'),
        ('ewes', 'sheep'),
        ('ovine', 'sheep'),
        ('Goats', 'goat'),
        ('buck', 'goat'),
        ('DOES', 'goat'),
        ('kid', 'goat'),
        ('Cattle', 'cattle'),
        ('cows', 'cattle'),
        ('Heifers', 'cattle'),
        ('calves', 'cattle'),
        ('Poultry', 'poultry'),
        ('broilers', 'poultry'),
        ('layer hens', 'poultry'),
        ('cockerels', 'poultry'),
    ],
)
def test_normalize_livestock_target_aliases(raw_target, expected):
    assert normalize_livestock_target(raw_target) == expected


def test_normalize_livestock_target_unknown_values_pass_through_cleanly():
    assert normalize_livestock_target('alpaca') == 'alpaca'
    assert normalize_livestock_target('  mystery-animal ') == 'mystery animal'
