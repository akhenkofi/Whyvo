from datetime import datetime
from typing import Optional, Literal, List
from pydantic import BaseModel, EmailStr


Country = Literal['GH', 'NG', 'BF']
UserType = Literal['Farmer', 'Buyer', 'Transporter', 'EquipmentProvider', 'StorageProvider']

ShippingScope = Literal['local', 'country', 'continent', 'worldwide']
ShippingCostType = Literal['free', 'flat_fee', 'buyer_pays_actual']


class UserCreate(BaseModel):
    full_name: str
    country: str
    region: str
    user_type: UserType
    password: Optional[str] = None
    signup_method: Literal['phone', 'email'] = 'phone'
    phone: Optional[str] = None
    email: Optional[str] = None
    accept_terms: bool = False
    accept_privacy: bool = False


class UserLogin(BaseModel):
    identifier: str
    password: str


class AccountUpdateIn(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    region: Optional[str] = None
    notification_preferences: Optional[dict] = None


class PasswordChangeIn(BaseModel):
    current_password: str
    new_password: str


class DeleteAccountIn(BaseModel):
    current_password: str


class OTPVerify(BaseModel):
    destination: str
    code: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'


class IDVerificationIn(BaseModel):
    user_id: int
    id_type: Literal['GhanaCard', 'NIN', 'BF National ID', 'Passport', 'Driver License', 'National ID', 'Voter ID', 'Residence Permit']
    id_number: str
    id_photo_url: str
    id_front_photo_url: Optional[str] = None
    id_back_photo_url: Optional[str] = None
    facial_verification_flag: bool = False


class IDVerificationSelfIn(BaseModel):
    id_type: Literal['GhanaCard', 'NIN', 'BF National ID', 'Passport', 'Driver License', 'National ID', 'Voter ID', 'Residence Permit']
    id_number: str
    id_photo_url: str = ''
    id_front_photo_url: Optional[str] = None
    id_back_photo_url: Optional[str] = None
    facial_verification_flag: bool = False


class VerificationDecisionIn(BaseModel):
    status: Literal['APPROVED', 'DENIED']
    reviewer_note: Optional[str] = None


class FarmPassportIn(BaseModel):
    user_id: int
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    farm_size_hectares: float = 0
    crop_types: str = '[]'
    livestock_numbers: str = '{}'
    farm_photo_urls: str = '[]'
    harvest_records_notes: str = ''


class FarmerProfileIn(BaseModel):
    user_id: int
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    farm_size_hectares: float = 0
    crops_summary: str = '{}'
    livestock_summary: str = '{}'
    photo_urls: str = '[]'


class CropListingIn(BaseModel):
    farmer_id: int
    crop_name: str
    quantity_kg: float
    unit_price: float
    location: Optional[str] = None
    country: Country = 'GH'
    status: str = 'OPEN'
    image_urls: str = '[]'
    cover_image_url: Optional[str] = None
    ships_from_country: str
    ships_from_city: str
    ships_to_scope: ShippingScope
    shipping_cost_type: ShippingCostType
    shipping_cost_amount: Optional[float] = None
    estimated_ship_days: str
    shipping_notes: Optional[str] = None


class LivestockListingIn(BaseModel):
    farmer_id: int
    livestock_type: str
    breed_type: Optional[str] = None
    description: Optional[str] = None
    weight_kg: Optional[float] = None
    weight_tolerance_kg: Optional[float] = None
    health_status: Optional[str] = None
    health_note: Optional[str] = None
    quantity: int
    unit_price: float
    location: Optional[str] = None
    country: Country = 'GH'
    status: str = 'OPEN'
    image_urls: str = '[]'
    cover_image_url: Optional[str] = None
    ships_from_country: str
    ships_from_city: str
    ships_to_scope: ShippingScope
    shipping_cost_type: ShippingCostType
    shipping_cost_amount: Optional[float] = None
    estimated_ship_days: str
    shipping_notes: Optional[str] = None


class LogisticsIn(BaseModel):
    requester_id: Optional[int] = None
    created_by: Optional[int] = None
    pickup_location: str
    dropoff_location: str
    cargo_type: Optional[str] = None
    cargo_details: Optional[str] = None
    weight_kg: float = 0
    status: str = 'PENDING'
    image_urls: str = '[]'
    cover_image_url: Optional[str] = None
    ships_from_country: str
    ships_from_city: str
    ships_to_scope: ShippingScope
    shipping_cost_type: ShippingCostType
    shipping_cost_amount: Optional[float] = None
    estimated_ship_days: str
    shipping_notes: Optional[str] = None


class EquipmentRentalIn(BaseModel):
    requester_id: int
    equipment_type: str
    duration_days: int
    location: str
    budget: float
    status: str = 'PENDING'
    image_urls: str = '[]'
    cover_image_url: Optional[str] = None
    ships_from_country: str
    ships_from_city: str
    ships_to_scope: ShippingScope
    shipping_cost_type: ShippingCostType
    shipping_cost_amount: Optional[float] = None
    estimated_ship_days: str
    shipping_notes: Optional[str] = None


class StorageReservationIn(BaseModel):
    requester_id: int
    storage_type: str
    quantity_kg: float
    location: str
    duration_days: int
    status: str = 'PENDING'
    image_urls: str = '[]'
    cover_image_url: Optional[str] = None
    ships_from_country: str
    ships_from_city: str
    ships_to_scope: ShippingScope
    shipping_cost_type: ShippingCostType
    shipping_cost_amount: Optional[float] = None
    estimated_ship_days: str
    shipping_notes: Optional[str] = None


class OfferIn(BaseModel):
    listing_id: int
    buyer_id: int
    offer_price: float
    quantity_kg: float


class OfferStatusIn(BaseModel):
    status: str


class LogisticsAcceptIn(BaseModel):
    transporter_id: int








class RefundRequestIn(BaseModel):
    buyer_note: Optional[str] = None
    amount: Optional[float] = None


class AutoReleaseIn(BaseModel):
    force: bool = False

class SellerPayoutProfileIn(BaseModel):
    user_id: int
    country: Optional[str] = 'GH'
    payout_method: str
    account_name: str
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    mobile_money_provider: Optional[str] = None
    mobile_money_number: Optional[str] = None
    currency: Optional[str] = 'GHS'
    default_payout_method: Optional[bool] = True


class SellerPayoutVerificationIn(BaseModel):
    is_verified: bool = False
    verification_status: str = 'PENDING'


class SellerPayoutOtpSendIn(BaseModel):
    user_id: int
    mobile_money_number: str


class SellerPayoutOtpVerifyIn(BaseModel):
    user_id: int
    mobile_money_number: str
    code: str

class MarketplaceOrderIn(BaseModel):
    buyer_id: int
    seller_id: int
    listing_type: str
    listing_id: int
    listing_title: str
    quantity: float = 1
    unit_price: float
    currency: Optional[str] = 'GHS'
    delivery_method: Optional[str] = 'STANDARD'
    delivery_note: Optional[str] = None
    buyer_note: Optional[str] = None


class MarketplaceOrderShipProof(BaseModel):
    name: str
    mime_type: str
    data_url: str

class MarketplaceOrderShipIn(BaseModel):
    tracking_number: Optional[str] = None
    proof_files: List[MarketplaceOrderShipProof] = []

class MarketplaceListingSummary(BaseModel):
    listing_id: int
    listing_type: str
    title: str
    summary: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = 'GHS'
    status: Optional[str] = None
    cover_image_url: Optional[str] = None
    shipping_summary: Optional[str] = None
    created_at: Optional[datetime] = None

class MarketplacePostSummary(BaseModel):
    id: int
    title: Optional[str] = None
    body: str
    media_urls: List[str] = []
    created_at: Optional[datetime] = None

class MarketplaceProfileResponse(BaseModel):
    marketplace_id: str
    display_name: str
    marketplace_handle: str
    bio: str
    avatar_url: Optional[str] = None
    listings: List[MarketplaceListingSummary] = []
    posts: List[MarketplacePostSummary] = []

class MarketplaceOrderStatusIn(BaseModel):
    escrow_status: Optional[str] = None
    fulfillment_status: Optional[str] = None
    payment_status: Optional[str] = None
    payout_status: Optional[str] = None
    seller_note: Optional[str] = None
    delivery_note: Optional[str] = None
    buyer_note: Optional[str] = None

class PaymentIn(BaseModel):
    payer_id: int
    payee_id: int
    amount: float
    country: Country
    method: str
    provider: str
    escrow_enabled: bool = True
    currency: Optional[str] = None




class PaystackInitializeIn(BaseModel):
    order_id: int
    buyer_email: EmailStr
    amount: float
    currency: Optional[str] = None

class PaystackVerifyIn(BaseModel):
    reference: str

class WeatherAlertIn(BaseModel):
    country: Country
    region: str
    severity: str = 'MEDIUM'
    alert_type: str
    message: str
    valid_until: Optional[datetime] = None


class ContractIn(BaseModel):
    origin_country: Country
    destination_country: Country
    commodity: str
    quantity: float
    price: float
    delivery_date: datetime
    payment_terms: str
    status: str = 'DRAFT'


class DeviceTokenIn(BaseModel):
    user_id: Optional[int] = None
    platform: str = 'web'
    token: str


class DiseaseAnalyzeIn(BaseModel):
    user_id: Optional[int] = None
    image_url: str
    crop_type: Optional[str] = None
    context_note: Optional[str] = None


class SheepGoatRecordIn(BaseModel):
    user_id: Optional[int] = None
    ownership: Optional[str] = None
    species: str = 'SHEEP'
    animal_type: str
    name: Optional[str] = None
    ear_tag: Optional[str] = None
    farm_id: Optional[str] = None
    registration_number: Optional[str] = None
    stars: int = 0
    date_of_birth: Optional[datetime] = None
    acquisition_date: Optional[datetime] = None
    purchased_from: Optional[str] = None
    purchased_from_type: Optional[Literal['BREEDER', 'MARKET', 'OTHER']] = None
    purchase_price: Optional[float] = None
    currency: str = 'GHS'
    sire_id: Optional[str] = None
    dam_id: Optional[str] = None
    litter_size: Optional[int] = None
    initial_weight_kg: Optional[float] = None
    breeding_type: Optional[str] = None
    castrated: bool = False
    sale_date: Optional[datetime] = None
    sale_price: Optional[float] = None
    sold_to: Optional[str] = None
    died_date: Optional[datetime] = None
    cull_keep_status: Optional[str] = None
    cull_reason: Optional[str] = None
    health_status: Optional[str] = None
    pen_location: Optional[str] = None
    notes: Optional[str] = ''


class LivestockPurchaseSourceIn(BaseModel):
    user_id: Optional[int] = None
    species: Optional[str] = 'ALL'
    name: str
    source_type: Optional[Literal['BREEDER', 'MARKET', 'OTHER']] = 'OTHER'


class SheepGoatBreedingGroupIn(BaseModel):
    user_id: Optional[int] = None
    name: str
    species: Literal['SHEEP', 'GOAT']
    male_type: Literal['RAM', 'BUCK']
    female_type: Literal['EWE', 'DOE']
    male_count: int = 0
    female_count: int = 0
    ratio_label: Optional[str] = None
    active: bool = True


class SheepGoatSubscriptionIn(BaseModel):
    user_id: Optional[int] = None
    plan_code: Literal['premium']
    country: str = 'GH'
    billing_cycle: Literal['monthly', 'yearly'] = 'monthly'
    currency: str
    force_paid: bool = False


class PoultryUniversitySubscriptionIn(BaseModel):
    user_id: Optional[int] = None
    plan_code: Literal['basic', 'pro']
    country: str = 'GH'
    billing_cycle: Literal['monthly', 'yearly'] = 'monthly'
    currency: str


class WorldChatMessageIn(BaseModel):
    text: str


class WorldChatModerationActionIn(BaseModel):
    message_id: int
    action: Literal['approve', 'hide', 'delete'] = 'approve'
    reason: Optional[str] = None


class WorldChatUserSanctionIn(BaseModel):
    mute_minutes: int = 0
    ban: bool = False
    reason: Optional[str] = None


class CommunityProfileIn(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    bio: Optional[str] = ''
    farm_life: Optional[str] = ''
    interests: Optional[str] = 'farming,gardening'
    visibility: Optional[Literal['PUBLIC', 'FOLLOWERS']] = 'PUBLIC'
    message_privacy: Optional[Literal['EVERYONE', 'FOLLOWING', 'NOBODY']] = 'FOLLOWING'


class CommunityDirectMessageIn(BaseModel):
    text: str


class FarmGameScoreSubmitIn(BaseModel):
    game_code: Literal['farmstack', 'farmrunner', 'tradetycoon']
    mode: Optional[str] = 'classic'
    score: int
    duration_seconds: Optional[int] = 0
    client_nonce: Optional[str] = None
    metadata_json: Optional[str] = '{}'


class FarmGameMissionClaimIn(BaseModel):
    mission_code: str
    period_code: str


class FarmGameStateIn(BaseModel):
    game_code: Literal['farmstack', 'farmrunner', 'tradetycoon']
    state_json: str


class CommunityPostIn(BaseModel):
    text: Optional[str] = ''
    media_url: Optional[str] = None
    media_type: Optional[Literal['TEXT', 'IMAGE', 'VIDEO']] = 'TEXT'
    tags: Optional[str] = ''


class CommunityCommentIn(BaseModel):
    text: str


class PlantIdentifyIn(BaseModel):
    user_id: Optional[int] = None
    image_url: str
    file_name: Optional[str] = None
    context_hint: Optional[str] = None
    target_livestock: Optional[str] = None


class PestIdentifyIn(BaseModel):
    user_id: Optional[int] = None
    crop_type: str
    image_url: str
    file_name: Optional[str] = None
    context_hint: Optional[str] = None
