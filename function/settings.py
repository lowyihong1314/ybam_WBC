import os
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parents[1]


def load_environment():
    load_dotenv(BASE_DIR / ".env")


def get_setting(*names, default=None, strip=True):
    for name in names:
        value = os.environ.get(name)
        if value is None:
            continue

        value = value.strip() if strip else value
        if value:
            return value

    return default


def get_required_setting(*names):
    value = get_setting(*names)
    if value:
        return value

    joined_names = " or ".join(names)
    raise RuntimeError(f"Missing required environment setting: {joined_names}")


load_environment()

SECRET_KEY = get_required_setting("SECRET_KEY", "secret_key")
WBC_PENANG_2026_TOKEN = get_required_setting(
    "WBC_PENANG_2026_TOKEN",
    "WBC_Penang_2026",
)
WBC_KL_2026_TOKEN = get_required_setting("WBC_KL_2026_TOKEN", "WBC_KL_2026")
BILLPLZ_API_KEY = get_required_setting("BILLPLZ_API_KEY", "API_KEY")
BILLPLZ_COLLECTION_ID = get_required_setting(
    "BILLPLZ_COLLECTION_ID",
    "COLLECTION_ID",
)
BILLPLZ_BASE_URL = get_required_setting("BILLPLZ_BASE_URL", "BASE").rstrip("/")
