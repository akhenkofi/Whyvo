from collections import defaultdict
from app.db.session import SessionLocal
from app.models.models import SheepGoatRecord, User


def main():
    db = SessionLocal()
    try:
        records = db.query(SheepGoatRecord).order_by(SheepGoatRecord.user_id.asc(), SheepGoatRecord.id.asc()).all()
        users = {u.id: u for u in db.query(User).all()}
        grouped = defaultdict(list)
        missing_user = []
        for r in records:
            grouped[r.user_id].append(r)
            if not r.user_id or r.user_id not in users:
                missing_user.append(r)

        print(f"TOTAL_RECORDS={len(records)}")
        print(f"TOTAL_USERS_WITH_RECORDS={len(grouped)}")
        print(f"RECORDS_WITH_MISSING_OWNER={len(missing_user)}")
        print("--- USERS WITH RECORD COUNTS ---")
        for user_id, recs in sorted(grouped.items(), key=lambda kv: (-len(kv[1]), kv[0] or 0)):
            user = users.get(user_id)
            label = f"{getattr(user,'full_name',None) or 'UNKNOWN'} | {getattr(user,'phone',None) or 'no-phone'}"
            sample = ', '.join(str(r.id) for r in recs[:10])
            print(f"user_id={user_id} count={len(recs)} owner={label} sample_record_ids=[{sample}]")

        if missing_user:
            print("--- RECORDS WITH MISSING/INVALID OWNER ---")
            for r in missing_user[:100]:
                print(f"record_id={r.id} user_id={r.user_id} species={r.species} animal_type={r.animal_type} name={r.name}")
    finally:
        db.close()


if __name__ == '__main__':
    main()
