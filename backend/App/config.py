import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# Database
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "MysticEldrago")
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "corpgpt")

SQLALCHEMY_DATABASE_URI = f"mysql+mysqlconnector://root:MysticEldrago!@localhost:3306/corpgpt"

# JWT
JWT_SECRET = os.getenv("JWT_SECRET", "change-this-secret")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRES_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRES_MINUTES", "15"))
REFRESH_TOKEN_EXPIRES_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRES_DAYS", "7"))

# Email (SMTP) for OTP/verification - set these in production
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT") or 587)
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
EMAIL_FROM = os.getenv("EMAIL_FROM", SMTP_USER)

# File storage & encryption key
UPLOAD_DIR = os.getenv("UPLOAD_DIR", str(BASE_DIR / "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)
FERNET_KEY = os.getenv("FERNET_KEY", "IaMFfj5SQ3mU0e54NKT796a96Iz0PhtppY")
 # base64 urlsafe 32-byte key. Generate if not present.

# Security toggles
REQUIRE_EMAIL_DOMAIN = os.getenv("REQUIRE_EMAIL_DOMAIN")  # e.g. "@yourcompany.com"
