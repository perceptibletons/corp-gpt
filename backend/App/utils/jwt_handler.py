import jwt
from datetime import datetime, timedelta
from fastapi import HTTPException
from ..config import JWT_SECRET, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRES_MINUTES, REFRESH_TOKEN_EXPIRES_DAYS


# ----------------------------------------------------
# Create Access Token
# ----------------------------------------------------
def create_access_token(subject: str, extra: dict = None):
    now = datetime.utcnow()
    payload = {
        "sub": str(subject),
        "iat": now,
        "exp": now + timedelta(minutes=ACCESS_TOKEN_EXPIRES_MINUTES)
    }
    if extra:
        payload.update(extra)
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token


# ----------------------------------------------------
# Create Refresh Token
# ----------------------------------------------------
def create_refresh_token(subject: str):
    now = datetime.utcnow()
    payload = {
        "sub": str(subject),
        "iat": now,
        "exp": now + timedelta(days=REFRESH_TOKEN_EXPIRES_DAYS),
        "type": "refresh"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


# ----------------------------------------------------
# Old decode method (kept for compatibility)
# ----------------------------------------------------
def decode_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


# ----------------------------------------------------
# NEW: Decode Access Token (used by Admin RBAC)
# ----------------------------------------------------
def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Access token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid access token")
