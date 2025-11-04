from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from .database import Base
import enum
from sqlalchemy.sql import func

class RoleEnum(str, enum.Enum):
    user = "user"
    admin = "admin"
    superadmin = "superadmin"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    company_id = Column(String(255), nullable=True)
    invite_code = Column(String(255), nullable=True)
    phone = Column(String(30), nullable=True)
    proof_path = Column(Text, nullable=True)  # encrypted file path
    is_verified = Column(Boolean, default=False)  # email verified
    is_approved = Column(Boolean, default=False)  # admin approval
    role = Column(Enum(RoleEnum), default=RoleEnum.user)
    totp_secret = Column(String(255), nullable=True)  # for TOTP if used
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

class OTPVerification(Base):
    __tablename__ = "otp_verifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    otp_code = Column(String(10), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(255), nullable=False)
    meta_info = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
