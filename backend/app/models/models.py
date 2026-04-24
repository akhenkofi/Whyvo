import enum
from datetime import datetime, timedelta
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.session import Base


class UserRole(str, enum.Enum):
    farmer = 'Farmer'
    buyer = 'Buyer'
    transporter = 'Transporter'
    equipment_provider = 'EquipmentProvider'
    storage_provider = 'StorageProvider'
    admin = 'Admin'


class CountryCode(str, enum.Enum):
    gh = 'GH'
    ng = 'NG'
    bf = 'BF'


class ShippingScope(str, enum.Enum):
    local = 'local'
    country = 'country'
    continent = 'continent'
    worldwide = 'worldwide'


class ShippingCostType(str, enum.Enum):
    free = 'free'
    flat_fee = 'flat_fee'
    buyer_pays_actual = 'buyer_pays_actual'


class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    phone = Column(String(30), unique=True, nullable=False, index=True)
    email = Column(String(160), unique=True, nullable=True, index=True)
    pending_email = Column(String(160), nullable=True, index=True)
    notification_preferences = Column(Text, default='{"calls": true, "orders": true, "verification": true, "push": true, "sms": false, "email": true}')
    country = Column(String(8), nullable=False)
    region = Column(String(120), default='Unknown')
    role = Column(Enum(UserRole), nullable=False)
    marketplace_id = Column(String(40), unique=True, nullable=True, index=True)
    buyer_verification_status = Column(String(32), default='FRICTIONLESS')
    seller_status = Column(String(32), default='PENDING')
    risk_score = Column(Float, default=0)
    risk_level = Column(String(20), default='LOW')
    risk_flags = Column(Text, default='[]')
    requires_additional_verification = Column(Boolean, default=False)
    payout_hold_until = Column(DateTime, nullable=True)
    payout_hold_reason = Column(String(255), nullable=True)
    seller_onboarded_at = Column(DateTime, nullable=True)
    hashed_password = Column(String(255), nullable=True)
    is_verified = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    farmer_profile = relationship('FarmerProfile', back_populates='user', uselist=False)


class OTPCode(Base):
    __tablename__ = 'otp_codes'
    id = Column(Integer, primary_key=True)
    phone = Column(String(30), index=True)
    destination = Column(String(160), index=True, nullable=True)
    channel = Column(String(20), default='phone')
    code = Column(String(6), nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class IDVerification(Base):
    __tablename__ = 'id_verifications'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)
    id_type = Column(String(80), nullable=False)
    id_number = Column(String(120), nullable=False)
    id_photo_url = Column(String(500), nullable=False)
    id_front_photo_url = Column(String(500), nullable=True)
    id_back_photo_url = Column(String(500), nullable=True)
    facial_verification_flag = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class VerificationReview(Base):
    __tablename__ = 'verification_reviews'
    id = Column(Integer, primary_key=True)
    id_verification_id = Column(Integer, ForeignKey('id_verifications.id'), unique=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)
    status = Column(String(20), default='PENDING')  # PENDING | APPROVED | DENIED
    ai_score = Column(Float, default=0)
    ai_reason = Column(Text, default='Awaiting analysis')
    reviewer_note = Column(Text, default='')
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class FarmerProfile(Base):
    __tablename__ = 'farmer_profiles'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True)
    gps_lat = Column(Float, nullable=True)
    gps_lng = Column(Float, nullable=True)
    farm_size_hectares = Column(Float, default=0)
    crops_summary = Column(Text, default='{}')
    livestock_summary = Column(Text, default='{}')
    photo_urls = Column(Text, default='[]')
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship('User', back_populates='farmer_profile')


class FarmPassport(Base):
    __tablename__ = 'farm_passports'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True)
    gps_lat = Column(Float, nullable=True)
    gps_lng = Column(Float, nullable=True)
    farm_size_hectares = Column(Float, default=0)
    crop_types = Column(Text, default='[]')
    livestock_numbers = Column(Text, default='{}')
    farm_photo_urls = Column(Text, default='[]')
    harvest_records_notes = Column(Text, default='')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ListingStatus(str, enum.Enum):
    open = 'OPEN'
    pending = 'PENDING'
    sold = 'SOLD'


class CropListing(Base):
    __tablename__ = 'crop_listings'
    id = Column(Integer, primary_key=True)
    farmer_id = Column(Integer, ForeignKey('users.id'))
    crop_name = Column(String(120), nullable=False)
    quantity_kg = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    location = Column(String(120), nullable=True)
    country = Column(Enum(CountryCode), default=CountryCode.gh)
    status = Column(Enum(ListingStatus), default=ListingStatus.open)
    image_urls = Column(Text, default='[]')
    cover_image_url = Column(Text, nullable=True)
    ships_from_country = Column(String(8), nullable=False, default='GH')
    ships_from_city = Column(String(120), nullable=False, default='Unknown')
    ships_to_scope = Column(Enum(ShippingScope), nullable=False, default=ShippingScope.country)
    shipping_cost_type = Column(Enum(ShippingCostType), nullable=False, default=ShippingCostType.free)
    shipping_cost_amount = Column(Float, nullable=True)
    estimated_ship_days = Column(String(120), nullable=False, default='Varies')
    shipping_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class LivestockListing(Base):
    __tablename__ = 'livestock_listings'
    id = Column(Integer, primary_key=True)
    farmer_id = Column(Integer, ForeignKey('users.id'))
    livestock_type = Column(String(120), nullable=False)
    breed_type = Column(String(120), nullable=True)
    description = Column(Text, nullable=True)
    weight_kg = Column(Float, nullable=True)
    weight_tolerance_kg = Column(Float, nullable=True)
    health_status = Column(String(120), nullable=True)
    health_note = Column(Text, nullable=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    location = Column(String(120), nullable=True)
    country = Column(Enum(CountryCode), default=CountryCode.gh)
    status = Column(String(30), default='OPEN')
    image_urls = Column(Text, default='[]')
    cover_image_url = Column(Text, nullable=True)
    ships_from_country = Column(String(8), nullable=False, default='GH')
    ships_from_city = Column(String(120), nullable=False, default='Unknown')
    ships_to_scope = Column(Enum(ShippingScope), nullable=False, default=ShippingScope.country)
    shipping_cost_type = Column(Enum(ShippingCostType), nullable=False, default=ShippingCostType.free)
    shipping_cost_amount = Column(Float, nullable=True)
    estimated_ship_days = Column(String(120), nullable=False, default='Varies')
    shipping_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ListingOffer(Base):
    __tablename__ = 'listing_offers'
    id = Column(Integer, primary_key=True)
    listing_id = Column(Integer, ForeignKey('crop_listings.id'))
    buyer_id = Column(Integer, ForeignKey('users.id'))
    offer_price = Column(Float, nullable=False)
    quantity_kg = Column(Float, nullable=False)
    status = Column(String(30), default='SUBMITTED')
    created_at = Column(DateTime, default=datetime.utcnow)


class LogisticsStatus(str, enum.Enum):
    requested = 'REQUESTED'
    accepted = 'ACCEPTED'
    in_transit = 'IN_TRANSIT'
    delivered = 'DELIVERED'


class LogisticsRequest(Base):
    __tablename__ = 'logistics_requests'
    id = Column(Integer, primary_key=True)
    requester_id = Column(Integer, ForeignKey('users.id'))
    transporter_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    pickup_location = Column(String(255), nullable=False)
    dropoff_location = Column(String(255), nullable=False)
    cargo_type = Column(String(255), nullable=False)
    weight_kg = Column(Float, default=0)
    status = Column(String(30), default='PENDING')
    tracking_note = Column(String(255), default='Awaiting transporter')
    image_urls = Column(Text, default='[]')
    cover_image_url = Column(Text, nullable=True)
    ships_from_country = Column(String(8), nullable=False, default='GH')
    ships_from_city = Column(String(120), nullable=False, default='Unknown')
    ships_to_scope = Column(Enum(ShippingScope), nullable=False, default=ShippingScope.country)
    shipping_cost_type = Column(Enum(ShippingCostType), nullable=False, default=ShippingCostType.free)
    shipping_cost_amount = Column(Float, nullable=True)
    estimated_ship_days = Column(String(120), nullable=False, default='Varies')
    shipping_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class EquipmentRental(Base):
    __tablename__ = 'equipment_rentals'
    id = Column(Integer, primary_key=True)
    requester_id = Column(Integer, ForeignKey('users.id'))
    equipment_type = Column(String(120), nullable=False)
    duration_days = Column(Integer, nullable=False)
    location = Column(String(120), nullable=False)
    budget = Column(Float, nullable=False)
    status = Column(String(30), default='PENDING')
    image_urls = Column(Text, default='[]')
    cover_image_url = Column(Text, nullable=True)
    ships_from_country = Column(String(8), nullable=False, default='GH')
    ships_from_city = Column(String(120), nullable=False, default='Unknown')
    ships_to_scope = Column(Enum(ShippingScope), nullable=False, default=ShippingScope.country)
    shipping_cost_type = Column(Enum(ShippingCostType), nullable=False, default=ShippingCostType.free)
    shipping_cost_amount = Column(Float, nullable=True)
    estimated_ship_days = Column(String(120), nullable=False, default='Varies')
    shipping_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class StorageReservation(Base):
    __tablename__ = 'storage_reservations'
    id = Column(Integer, primary_key=True)
    requester_id = Column(Integer, ForeignKey('users.id'))
    storage_type = Column(String(120), nullable=False)
    quantity_kg = Column(Float, nullable=False)
    location = Column(String(120), nullable=False)
    duration_days = Column(Integer, nullable=False)
    status = Column(String(30), default='PENDING')
    image_urls = Column(Text, default='[]')
    cover_image_url = Column(Text, nullable=True)
    ships_from_country = Column(String(8), nullable=False, default='GH')
    ships_from_city = Column(String(120), nullable=False, default='Unknown')
    ships_to_scope = Column(Enum(ShippingScope), nullable=False, default=ShippingScope.country)
    shipping_cost_type = Column(Enum(ShippingCostType), nullable=False, default=ShippingCostType.free)
    shipping_cost_amount = Column(Float, nullable=True)
    estimated_ship_days = Column(String(120), nullable=False, default='Varies')
    shipping_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)








class MarketplaceNotification(Base):
    __tablename__ = 'marketplace_notifications'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    title = Column(String(180), nullable=False)
    message = Column(Text, nullable=False)
    data = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class MarketplaceDispute(Base):
    __tablename__ = 'marketplace_disputes'
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey('marketplace_orders.id'), nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    seller_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    buyer_description = Column(Text, nullable=False)
    buyer_evidence_url = Column(Text, nullable=True)
    seller_description = Column(Text, nullable=True)
    seller_evidence_url = Column(Text, nullable=True)
    status = Column(String(32), default='open')
    created_at = Column(DateTime, default=datetime.utcnow)


class PayoutHistory(Base):
    __tablename__ = 'payout_history'
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, nullable=False)
    seller_id = Column(Integer, ForeignKey('users.id'))
    payout_profile_id = Column(Integer, ForeignKey('seller_payout_profiles.id'), nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default='GHS')
    status = Column(String(40), default='PENDING')
    reference = Column(String(120), nullable=True)
    transfer_code = Column(String(120), nullable=True)
    receipt_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class SellerPayoutProfile(Base):
    __tablename__ = 'seller_payout_profiles'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True)
    country = Column(String(10), default='GH')
    payout_method = Column(String(40), default='MOBILE_MONEY')
    account_name = Column(String(160), nullable=False)
    bank_name = Column(String(120), nullable=True)
    account_number = Column(String(120), nullable=True)
    mobile_money_provider = Column(String(80), nullable=True)
    mobile_money_number = Column(String(80), nullable=True)
    currency = Column(String(10), default='GHS')
    is_verified = Column(Boolean, default=False)
    verification_status = Column(String(40), default='PENDING')
    transfer_recipient_code = Column(String(120), nullable=True)
    recipient_last_status = Column(String(120), nullable=True)
    default_payout_method = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class MarketplaceOrder(Base):
    __tablename__ = 'marketplace_orders'
    id = Column(Integer, primary_key=True)
    buyer_id = Column(Integer, ForeignKey('users.id'))
    seller_id = Column(Integer, ForeignKey('users.id'))
    buyer_marketplace_id = Column(String(40), nullable=True, index=True)
    seller_marketplace_id = Column(String(40), nullable=True, index=True)
    listing_type = Column(String(30), nullable=False)
    listing_id = Column(Integer, nullable=False)
    listing_title = Column(String(180), nullable=False)
    quantity = Column(Float, default=1)
    unit_price = Column(Float, nullable=False)
    gross_amount = Column(Float, nullable=False)
    platform_fee = Column(Float, default=0)
    processing_fee = Column(Float, default=0)
    seller_net = Column(Float, default=0)
    platform_fee_amount = Column(Float, default=0)
    seller_payout_amount = Column(Float, default=0)
    currency = Column(String(10), default='GHS')
    status = Column(String(20), default='pending')
    tracking_number = Column(String(120), nullable=True)
    tracking_proof_url = Column(String(500), nullable=True)
    shipped_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    funds_release_at = Column(DateTime, nullable=True)
    seller_ship_deadline = Column(DateTime, nullable=True)
    escrow_status = Column(String(40), default='AWAITING_PAYMENT')
    fulfillment_status = Column(String(40), default='PENDING')
    payment_status = Column(String(40), default='UNPAID')
    payout_status = Column(String(40), default='HELD')
    delivery_method = Column(String(60), default='STANDARD')
    delivery_note = Column(Text, nullable=True)
    buyer_note = Column(Text, nullable=True)
    seller_note = Column(Text, nullable=True)
    payment_reference = Column(String(120), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Payment(Base):
    __tablename__ = 'payments'
    id = Column(Integer, primary_key=True)
    payer_id = Column(Integer, ForeignKey('users.id'))
    payee_id = Column(Integer, ForeignKey('users.id'))
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default='GHS')
    country = Column(Enum(CountryCode), default=CountryCode.gh)
    method = Column(String(50), default='MobileMoney')
    provider = Column(String(50), default='MTN')
    escrow_enabled = Column(Boolean, default=True)
    status = Column(String(30), default='PENDING')
    reference = Column(String(120), unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class WeatherAlert(Base):
    __tablename__ = 'weather_alerts'
    id = Column(Integer, primary_key=True)
    country = Column(Enum(CountryCode), nullable=False)
    region = Column(String(120), nullable=False)
    severity = Column(String(20), default='MEDIUM')
    alert_type = Column(String(120), nullable=False)
    message = Column(Text, nullable=False)
    valid_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class TradeContract(Base):
    __tablename__ = 'trade_contracts'
    id = Column(Integer, primary_key=True)
    origin_country = Column(Enum(CountryCode), nullable=False)
    destination_country = Column(Enum(CountryCode), nullable=False)
    commodity = Column(String(120), nullable=False)
    quantity = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    delivery_date = Column(DateTime, nullable=False)
    payment_terms = Column(Text, nullable=False)
    status = Column(String(50), default='DRAFT')
    created_at = Column(DateTime, default=datetime.utcnow)


class UpdateReview(Base):
    __tablename__ = 'update_reviews'
    id = Column(Integer, primary_key=True)
    module = Column(String(80), nullable=False)  # products, livestock, etc.
    record_id = Column(Integer, nullable=False)
    action = Column(String(30), nullable=False)  # update, patch
    payload_json = Column(Text, default='{}')
    ai_score = Column(Float, default=0)
    decision = Column(String(20), default='DENIED')  # APPROVED|DENIED
    reason = Column(Text, default='')
    created_at = Column(DateTime, default=datetime.utcnow)


class DeviceToken(Base):
    __tablename__ = 'device_tokens'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    platform = Column(String(20), default='web')
    token = Column(String(500), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class DiseaseScan(Base):
    __tablename__ = 'disease_scans'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    image_url = Column(String(500), nullable=False)
    crop_type = Column(String(120), nullable=True)
    result = Column(Text, default='{}')
    created_at = Column(DateTime, default=datetime.utcnow)


class SheepGoatRecord(Base):
    __tablename__ = 'sheep_goat_records'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)
    ownership = Column(String(120), nullable=True)
    species = Column(String(20), default='SHEEP')  # SHEEP | GOAT | CATTLE | POULTRY
    animal_type = Column(String(20), nullable=False)
    name = Column(String(120), nullable=True)
    ear_tag = Column(String(120), nullable=True, index=True)
    farm_id = Column(String(120), nullable=True)
    registration_number = Column(String(120), nullable=True)
    stars = Column(Integer, default=0)
    date_of_birth = Column(DateTime, nullable=True)
    acquisition_date = Column(DateTime, nullable=True)
    purchased_from = Column(String(160), nullable=True)
    purchased_from_type = Column(String(20), nullable=True)  # BREEDER | MARKET | OTHER
    purchase_price = Column(Float, nullable=True)
    currency = Column(String(10), default='GHS')
    sire_id = Column(String(120), nullable=True)
    dam_id = Column(String(120), nullable=True)
    litter_size = Column(Integer, nullable=True)
    initial_weight_kg = Column(Float, nullable=True)
    breeding_type = Column(String(80), nullable=True)
    castrated = Column(Boolean, default=False)
    sale_date = Column(DateTime, nullable=True)
    sale_price = Column(Float, nullable=True)
    sold_to = Column(String(120), nullable=True)
    died_date = Column(DateTime, nullable=True)
    cull_keep_status = Column(String(20), nullable=True)  # KEEP|CULL
    cull_reason = Column(String(255), nullable=True)
    health_status = Column(String(120), nullable=True)
    pen_location = Column(String(120), nullable=True)
    notes = Column(Text, default='')
    created_at = Column(DateTime, default=datetime.utcnow)


class LivestockPurchaseSource(Base):
    __tablename__ = 'livestock_purchase_sources'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)
    species = Column(String(20), nullable=True)  # SHEEP | GOAT | CATTLE | ALL
    name = Column(String(160), nullable=False, index=True)
    source_type = Column(String(20), nullable=True)  # BREEDER | MARKET | OTHER
    created_at = Column(DateTime, default=datetime.utcnow)


class SheepGoatBreedingGroup(Base):
    __tablename__ = 'sheep_goat_breeding_groups'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)
    name = Column(String(120), nullable=False)
    species = Column(String(20), nullable=False)
    male_type = Column(String(20), nullable=False)
    female_type = Column(String(20), nullable=False)
    male_count = Column(Integer, default=0)
    female_count = Column(Integer, default=0)
    ratio_label = Column(String(40), nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class SheepGoatSubscription(Base):
    __tablename__ = 'sheep_goat_subscriptions'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)
    plan_code = Column(String(40), nullable=False)
    country = Column(String(40), default='GH')
    billing_cycle = Column(String(20), default='monthly')
    amount = Column(Float, nullable=False)
    currency = Column(String(10), nullable=False)
    status = Column(String(20), default='ACTIVE')
    reference = Column(String(120), nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    ends_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class WorldChatMessage(Base):
    __tablename__ = 'world_chat_messages'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    user_name = Column(String(120), nullable=True)
    user_country = Column(String(10), nullable=True)
    text = Column(Text, nullable=False)
    status = Column(String(20), default='VISIBLE')  # VISIBLE|HIDDEN|BLOCKED
    moderation_label = Column(String(40), nullable=True)  # SAFE|SPAM|ABUSE|SCAM|SEXUAL|VIOLENCE
    moderation_score = Column(Float, default=0)
    moderation_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class WorldChatUserModeration(Base):
    __tablename__ = 'world_chat_user_moderation'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, unique=True, index=True)
    muted_until = Column(DateTime, nullable=True)
    is_banned = Column(Boolean, default=False)
    strike_count = Column(Integer, default=0)
    last_reason = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow)


class CommunityProfile(Base):
    __tablename__ = 'community_profiles'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, unique=True, index=True)
    username = Column(String(80), nullable=True, index=True)
    avatar_url = Column(Text, nullable=True)
    cover_image_url = Column(Text, nullable=True)
    bio = Column(Text, default='')
    farm_life = Column(Text, default='')
    interests = Column(String(255), default='farming,gardening')
    visibility = Column(String(20), default='PUBLIC')
    message_privacy = Column(String(20), default='FOLLOWING')  # EVERYONE|FOLLOWING|NOBODY
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CommunityFollow(Base):
    __tablename__ = 'community_follows'
    __table_args__ = (
        UniqueConstraint('follower_user_id', 'followed_user_id', name='uq_community_follows_pair'),
    )
    id = Column(Integer, primary_key=True)
    follower_user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    followed_user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class CommunityMute(Base):
    __tablename__ = 'community_mutes'
    __table_args__ = (
        UniqueConstraint('muter_user_id', 'muted_user_id', name='uq_community_mutes_pair'),
    )
    id = Column(Integer, primary_key=True)
    muter_user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    muted_user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class CommunityPost(Base):
    __tablename__ = 'community_posts'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    author_name = Column(String(120), nullable=True)
    author_country = Column(String(10), nullable=True)
    text = Column(Text, default='')
    media_url = Column(Text, nullable=True)
    media_type = Column(String(20), default='TEXT')  # TEXT|IMAGE|VIDEO
    tags = Column(String(255), default='')
    status = Column(String(20), default='VISIBLE')  # VISIBLE|HIDDEN
    moderation_label = Column(String(40), nullable=True)
    moderation_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class CommunityPostLike(Base):
    __tablename__ = 'community_post_likes'
    __table_args__ = (
        UniqueConstraint('post_id', 'user_id', name='uq_community_post_likes_post_user'),
    )
    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey('community_posts.id'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class CommunityPostComment(Base):
    __tablename__ = 'community_post_comments'
    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey('community_posts.id'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    author_name = Column(String(120), nullable=True)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class MarketplaceProfile(Base):
    __tablename__ = 'marketplace_profiles'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, unique=True, index=True)
    marketplace_id = Column(String(40), nullable=True, unique=True, index=True)
    display_name = Column(String(120), nullable=False)
    username = Column(String(80), nullable=False, index=True)
    bio = Column(Text, default='')
    avatar_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class MarketplacePost(Base):
    __tablename__ = 'marketplace_posts'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    title = Column(String(160), nullable=True)
    body = Column(Text, nullable=False)
    media_urls = Column(Text, default='[]')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CommunityDirectMessage(Base):
    __tablename__ = 'community_direct_messages'
    id = Column(Integer, primary_key=True)
    sender_user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    recipient_user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    text = Column(Text, nullable=False)
    risk_flagged = Column(Boolean, default=False)
    risk_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class FarmGameWallet(Base):
    __tablename__ = 'farm_game_wallets'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True, nullable=False, index=True)
    credits_balance = Column(Integer, default=0)
    lifetime_credits_earned = Column(Integer, default=0)
    lifetime_credits_spent = Column(Integer, default=0)
    current_streak_days = Column(Integer, default=0)
    last_login_reward_at = Column(DateTime, nullable=True)
    last_active_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class FarmGameScore(Base):
    __tablename__ = 'farm_game_scores'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    game_code = Column(String(40), nullable=False, index=True)
    mode = Column(String(40), default='classic', index=True)
    score = Column(Integer, default=0, index=True)
    credits_awarded = Column(Integer, default=0)
    duration_seconds = Column(Integer, default=0)
    metadata_json = Column(Text, default='{}')
    client_nonce = Column(String(120), nullable=True, index=True)
    submitted_at = Column(DateTime, default=datetime.utcnow, index=True)


class FarmGameMissionClaim(Base):
    __tablename__ = 'farm_game_mission_claims'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    mission_code = Column(String(80), nullable=False, index=True)
    period_code = Column(String(40), nullable=False, index=True)
    credits_awarded = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    __table_args__ = (UniqueConstraint('user_id', 'mission_code', 'period_code', name='uq_farm_game_mission_claim'),)


class FarmGameState(Base):
    __tablename__ = 'farm_game_states'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    game_code = Column(String(40), nullable=False, index=True)
    state_json = Column(Text, default='{}')
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    __table_args__ = (UniqueConstraint('user_id', 'game_code', name='uq_farm_game_state'),)
