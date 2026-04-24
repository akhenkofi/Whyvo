from app.api.routes import normalize_livestock_target


CASES = {
    'Sheep': 'sheep',
    'RAM': 'sheep',
    'ewes': 'sheep',
    'Goats': 'goat',
    'buck': 'goat',
    'DOES': 'goat',
    'Cattle': 'cattle',
    'Heifers': 'cattle',
    'calves': 'cattle',
    'Poultry': 'poultry',
    'broilers': 'poultry',
    'layer hens': 'poultry',
}


def main():
    failures = []
    for raw, expected in CASES.items():
        actual = normalize_livestock_target(raw)
        if actual != expected:
            failures.append((raw, expected, actual))

    if failures:
        for raw, expected, actual in failures:
            print(f'FAIL: {raw!r} -> {actual!r} (expected {expected!r})')
        raise SystemExit(1)

    print(f'PASS: {len(CASES)} disease-analyzer normalization checks passed')


if __name__ == '__main__':
    main()
