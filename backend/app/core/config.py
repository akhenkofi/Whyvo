from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[3]
ENV_FILE = BASE_DIR / 'backend' / '.env'
FALLBACK_ENV_FILE = BASE_DIR / '.env'
ACTIVE_ENV_FILE = ENV_FILE if ENV_FILE.exists() else FALLBACK_ENV_FILE


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(ACTIVE_ENV_FILE), env_file_encoding='utf-8', extra='ignore')

    APP_NAME: str = 'Whyvo API'
    SECRET_KEY: str = 'change-me'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 5256000
    DATABASE_URL: str = 'sqlite:///./whyvo.db'
    OTP_BYPASS_CODE: str = '123456'

    # OTP delivery (optional providers)
    SMTP_HOST: str = ''
    SMTP_PORT: int = 587
    SMTP_USER: str = ''
    SMTP_PASS: str = ''
    SMTP_FROM: str = 'no-reply@whyvo.app'
    TWILIO_ACCOUNT_SID: str = ''
    TWILIO_AUTH_TOKEN: str = ''
    TWILIO_FROM_NUMBER: str = ''
    GHANA_TWILIO_SENDER_ID: str = 'SheepGhana'
    OWNER_PAYOUT_MOMO_GH: str = ''
    OWNER_PAYOUT_US_BANK: str = ''

    PAYSTACK_SECRET_KEY: str = ''
    PAYSTACK_PUBLIC_KEY: str = ''
    PAYSTACK_WEBHOOK_SECRET: str = ''
    PAYSTACK_CALLBACK_URL: str = 'https://www.whyvo.app/'

    # Push notifications (optional)
    FCM_SERVER_KEY: str = ''  # legacy fallback
    FIREBASE_PROJECT_ID: str = ''
    FIREBASE_SERVICE_ACCOUNT_JSON: str = ''

    # Agora calling
    AGORA_APP_ID: str = ''
    AGORA_APP_CERTIFICATE: str = ''

    # App security
    FRONTEND_ORIGINS: str = 'https://www.whyvo.app,https://api.whyvo.app'
    FORCE_HTTPS: bool = True

    # Optional external AI connectors
    PLANT_ID_API_KEY: str = ''
    AUTO_RELEASE_ENABLED: bool = True
    AUTO_RELEASE_INTERVAL_SECONDS: int = 900


settings = Settings()


def resolved_database_url() -> str:
    raw = str(settings.DATABASE_URL or '').strip()
    if not raw.startswith('sqlite:///'):
        return raw

    sqlite_path = raw[len('sqlite:///'):]
    if sqlite_path.startswith('/'):
        return raw

    base_dir = Path(__file__).resolve().parents[3]
    stable_dir = base_dir / 'data' / 'persistent'
    stable_dir.mkdir(parents=True, exist_ok=True)

    name = Path(sqlite_path).name or 'whyvo.db'
    stable_path = (stable_dir / name).resolve()
    return f"sqlite:///{stable_path}"
