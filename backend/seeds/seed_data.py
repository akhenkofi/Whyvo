from datetime import datetime, timedelta
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.session import SessionLocal, Base, engine
from app.core.security import hash_password
from app.models.models import (
    User, UserRole, CountryCode, CropListing, LogisticsRequest, WeatherAlert,
    LivestockListing, EquipmentRental, StorageReservation, Payment,
    TradeContract, IDVerification, FarmPassport
)

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
db = SessionLocal()

users = [
    User(full_name='Kwame Mensah', phone='+233200000001', country=CountryCode.gh, region='Ashanti', role=UserRole.farmer, is_verified=True, hashed_password=hash_password('Pass1234!')),
    User(full_name='Adaeze Okafor', phone='+234800000001', country=CountryCode.ng, region='Lagos', role=UserRole.buyer, is_verified=True, hashed_password=hash_password('Pass1234!')),
    User(full_name='Oumar Traore', phone='+226700000001', country=CountryCode.bf, region='Centre', role=UserRole.transporter, is_verified=True, hashed_password=hash_password('Pass1234!')),
    User(full_name='Ama Boateng', phone='+233200000002', country=CountryCode.gh, region='Greater Accra', role=UserRole.equipment_provider, is_verified=True, hashed_password=hash_password('Pass1234!')),
    User(full_name='Chinedu Obi', phone='+234800000002', country=CountryCode.ng, region='Kano', role=UserRole.storage_provider, is_verified=True, hashed_password=hash_password('Pass1234!')),
]
db.add_all(users)
db.commit()

# onboarding
idv = IDVerification(user_id=1, id_type='GhanaCard', id_number='GHA-123456789-0', id_photo_url='https://example.com/gh-id.jpg', facial_verification_flag=True)
passport = FarmPassport(user_id=1, gps_lat=6.6885, gps_lng=-1.6244, farm_size_hectares=4.5, crop_types='["Maize","Tomato"]', livestock_numbers='{"goat":8,"poultry":40}', farm_photo_urls='["https://example.com/farm1.jpg"]', harvest_records_notes='Last season yield improved by irrigation')
db.add_all([idv, passport])

# marketplace
db.add_all([
    CropListing(farmer_id=1, crop_name='Maize', quantity_kg=1200, unit_price=2.4, location='Kumasi', country=CountryCode.gh),
    CropListing(farmer_id=1, crop_name='Cassava', quantity_kg=900, unit_price=1.6, location='Kumasi', country=CountryCode.gh),
    LivestockListing(farmer_id=1, livestock_type='Goat', quantity=20, unit_price=85, location='Kumasi', country=CountryCode.gh),
])

# services
db.add_all([
    LogisticsRequest(requester_id=2, pickup_location='Kumasi', dropoff_location='Accra', cargo_type='50 bags maize', weight_kg=2500, status='PENDING'),
    EquipmentRental(requester_id=1, equipment_type='Tractor', duration_days=3, location='Ashanti', budget=450, status='PENDING'),
    StorageReservation(requester_id=2, storage_type='Cold Room', quantity_kg=1500, location='Lagos', duration_days=7, status='PENDING'),
])

# payments
payment = Payment(payer_id=2, payee_id=1, amount=1200, currency='GHS', country=CountryCode.gh, method='MobileMoney', provider='MTN', escrow_enabled=True, status='SUCCESS', reference='PAY-SEED-001')
db.add(payment)

# alerts
db.add_all([
    WeatherAlert(country=CountryCode.gh, region='Ashanti', severity='HIGH', alert_type='Heavy Rain', message='Expected heavy rainfall in next 24h'),
    WeatherAlert(country=CountryCode.ng, region='Lagos', severity='MEDIUM', alert_type='Heat Wave', message='High temperatures expected this week'),
    WeatherAlert(country=CountryCode.bf, region='Centre', severity='LOW', alert_type='Wind Advisory', message='Moderate wind gusts in farming zones'),
])

# trade contracts
db.add(TradeContract(origin_country=CountryCode.gh, destination_country=CountryCode.ng, commodity='Maize', quantity=5000, price=15000, delivery_date=datetime.utcnow() + timedelta(days=14), payment_terms='40% upfront, 60% on delivery', status='IN_NEGOTIATION'))

db.commit()
db.close()
print('Seed complete.')
