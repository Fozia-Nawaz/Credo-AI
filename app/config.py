import os
from typing import List

from dotenv import load_dotenv

load_dotenv()


def _get_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _get_csv_list(name: str, default: str) -> List[str]:
    raw_value = os.getenv(name, default)
    if not raw_value:
        return []
    return [item.strip() for item in raw_value.split(",") if item.strip()]


class Settings:
    app_name: str = "Credo AI Verification API"
    environment: str = os.getenv("ENVIRONMENT", "development")
    port: int = int(os.getenv("PORT", "8000"))
    sample_mode: bool = _get_bool("SAMPLE_MODE", True)
    frontend_origins: List[str] = _get_csv_list("FRONTEND_ORIGIN", "http://localhost:3000")
    zetaris_cloud_url: str = os.getenv("ZETARIS_CLOUD_URL", "https://cloud.enterprise.zetaris.com")
    zetaris_api_key: str = os.getenv("ZETARIS_API_KEY", "")


settings = Settings()
