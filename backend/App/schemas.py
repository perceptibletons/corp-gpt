from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from enum import Enum
import datetime

class RoleEnum(str, Enum):
    user = "user"
    admin = "admin"
    superadmin = "superadmin"

class SignupIn(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=8)
    companyId: Optional[str] = None
    inviteCode: Optional[str] = None
    phone: Optional[str] = None

class SignupResponse(BaseModel):
    message: str

class VerifyOTPIn(BaseModel):
    email: EmailStr
    otp: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str
    otp: Optional[str] = None  # if 2FA required

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None
    expires_in: Optional[int] = None

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: RoleEnum
    is_verified: bool
    is_approved: bool

    class Config:
        orm_mode = True
