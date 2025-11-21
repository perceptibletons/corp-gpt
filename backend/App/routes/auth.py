from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, Request
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..utils.hashing import hash_password, verify_password
from ..utils.otp_handler import generate_numeric_otp, send_email
from ..utils.file_crypto import save_encrypted_file
from ..utils.jwt_handler import create_access_token, create_refresh_token
from ..config import REQUIRE_EMAIL_DOMAIN
from ..utils.logger import log_action
from datetime import datetime, timedelta
from fastapi import Body

router = APIRouter(prefix="/api/auth", tags=["auth"])


# =====================================================================
# SIGNUP (with corporate role restriction)
# =====================================================================
@router.post("/signup", response_model=schemas.SignupResponse, status_code=201)
def signup(
    request: Request,
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    companyId: str = Form(None),
    inviteCode: str = Form(None),
    phone: str = Form(None),
    role: str = Form("employee"),
    proof: UploadFile = File(None),
    db: Session = Depends(get_db),
):

    # enforce corporate domain
    if REQUIRE_EMAIL_DOMAIN and not email.lower().endswith(REQUIRE_EMAIL_DOMAIN.lower()):
        raise HTTPException(status_code=400, detail="Email must be corporate domain.")

    # check if already registered
    exists = db.query(models.User).filter(models.User.email == email.lower()).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email already registered.")

    # allowed roles for self-signup
    allowed_roles = [models.RoleEnum.employee, models.RoleEnum.intern]

    try:
        requested_role = models.RoleEnum(role)
    except:
        raise HTTPException(status_code=400, detail="Invalid role provided.")

    # force unauthorized roles to employee
    if requested_role not in allowed_roles:
        requested_role = models.RoleEnum.employee
        
        # FIX: clean whitespace or multipart corruption
    password = password.strip()

    hashed = hash_password(password)

    user = models.User(
        name=name,
        email=email.lower(),
        password_hash=hashed,
        company_id=companyId,
        invite_code=inviteCode,
        phone=phone,
        is_verified=False,
        is_approved=False,
        role=requested_role,
    )

    # proof upload
    if proof:
        raw = proof.file.read()
        filename = f"{int(datetime.utcnow().timestamp())}_{proof.filename}"
        path = save_encrypted_file(raw, filename)
        user.proof_path = path

    db.add(user)
    db.commit()
    db.refresh(user)

    # OTP for email verification
    otp_code = generate_numeric_otp(6)
    expires_at = datetime.utcnow() + timedelta(minutes=12)

    otp = models.OTPVerification(
        user_id=user.id,
        otp_code=otp_code,
        expires_at=expires_at,
        is_used=False
    )
    db.add(otp)
    db.commit()

    try:
        send_email(
            user.email,
            "CorpGPT: Verify your email",
            f"Your verification OTP is: {otp_code}. It expires in 12 minutes.",
        )
    except Exception as e:
        print("Email send failed:", e)

    log_action(user.id, "signup_requested", metadata=f"ip={request.client.host}")

    return {"message": "Signup request received. Check your email for OTP to verify your account."}


# =====================================================================
# VERIFY SIGNUP OTP
# =====================================================================
@router.post("/verify", response_model=schemas.SignupResponse)
def verify_otp(payload: schemas.VerifyOTPIn, db: Session = Depends(get_db)):

    user = db.query(models.User).filter(models.User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(status_code=400, detail="No such user")

    otp = db.query(models.OTPVerification).filter(
        models.OTPVerification.user_id == user.id,
        models.OTPVerification.otp_code == payload.otp,
        models.OTPVerification.is_used == False
    ).order_by(models.OTPVerification.id.desc()).first()

    if not otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if otp.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP expired")

    otp.is_used = True
    user.is_verified = True
    db.commit()

    log_action(user.id, "email_verified")
    return {"message": "Email verified successfully. Wait for admin approval if required."}


# =====================================================================
# LOGIN STEP 1 — Check password + send OTP (required for ALL logins)
# =====================================================================
@router.post("/login/start")
def login_start(payload: schemas.LoginIn, db: Session = Depends(get_db)):

    user = db.query(models.User).filter(models.User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified")

    if not user.is_approved:
        raise HTTPException(status_code=403, detail="Account not approved by admin")

    # DISABLED RATE LIMIT FOR DEVELOPMENT
# one_hour_ago = datetime.utcnow() - timedelta(hours=1)
# recent_count = db.query(models.OTPVerification).filter(
#     models.OTPVerification.user_id == user.id,
#     models.OTPVerification.created_at >= one_hour_ago
# ).count()

# if recent_count >= 5:
#     raise HTTPException(status_code=429, detail="Too many OTP requests. Try again later.")

    otp_code = generate_numeric_otp(6)
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    otp = models.OTPVerification(
        user_id=user.id,
        otp_code=otp_code,
        expires_at=expires_at,
        is_used=False
    )
    db.add(otp)
    db.commit()

    try:
        send_email(
            user.email,
            "CorpGPT Login OTP",
            f"Your login OTP is: {otp_code}. It expires in 10 minutes."
        )
    except Exception as e:
        print("Login OTP email failed:", e)

    return {"message": "OTP sent to your email."}


# =====================================================================
# LOGIN STEP 2 — Verify OTP + return JWT
# =====================================================================
@router.post("/login/verify", response_model=schemas.TokenResponse)
def login_verify(payload: schemas.VerifyOTPIn, db: Session = Depends(get_db)):

    user = db.query(models.User).filter(models.User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    otp = db.query(models.OTPVerification).filter(
        models.OTPVerification.user_id == user.id,
        models.OTPVerification.otp_code == payload.otp,
        models.OTPVerification.is_used == False
    ).order_by(models.OTPVerification.id.desc()).first()

    if not otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if otp.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP expired")

    otp.is_used = True
    db.commit()

    access = create_access_token(subject=user.id, extra={"role": user.role.value})
    refresh = create_refresh_token(subject=user.id)

    log_action(user.id, "login_2fa")

    return {
        "access_token": access,
        "refresh_token": refresh,
        "role": user.role.value,
        "expires_in": None
    }


# =====================================================================
# OLD LOGIN (kept for backward compatibility)
# =====================================================================
@router.post("/login-old", response_model=schemas.TokenResponse)
def login_old(payload: schemas.LoginIn, db: Session = Depends(get_db)):

    user = db.query(models.User).filter(models.User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified")

    if not user.is_approved:
        raise HTTPException(status_code=403, detail="Account not approved by admin")

    access = create_access_token(subject=user.id, extra={"role": user.role.value})
    refresh = create_refresh_token(subject=user.id)

    return {
        "access_token": access,
        "refresh_token": refresh,
        "role": user.role.value,
        "expires_in": None
    }
