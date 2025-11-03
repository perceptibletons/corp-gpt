from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from fastapi import Request
from sqlalchemy.orm import Session
from ..database import get_db, SessionLocal
from .. import models, schemas
from ..utils.hashing import hash_password, verify_password
from ..utils.otp_handler import generate_numeric_otp, send_email, generate_totp_secret, verify_totp
from ..utils.file_crypto import save_encrypted_file
from ..utils.jwt_handler import create_access_token, create_refresh_token
from ..config import REQUIRE_EMAIL_DOMAIN
from ..utils.logger import log_action
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/signup", response_model=schemas.SignupResponse, status_code=201)
def signup(
    request: Request,
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    companyId: str = Form(None),
    inviteCode: str = Form(None),
    phone: str = Form(None),
    proof: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    # enforce company domain if configured
    if REQUIRE_EMAIL_DOMAIN and not email.lower().endswith(REQUIRE_EMAIL_DOMAIN.lower()):
        raise HTTPException(status_code=400, detail="Email must be corporate domain.")

    # check existing
    exists = db.query(models.User).filter(models.User.email == email.lower()).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email already registered.")

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
        role=models.RoleEnum.user,
    )

    # handle uploaded proof file (encrypt and save)
    if proof:
        raw = proof.file.read()
        filename = f"{int(datetime.utcnow().timestamp())}_{proof.filename}"
        path = save_encrypted_file(raw, filename)
        user.proof_path = path

    db.add(user)
    db.commit()
    db.refresh(user)

    # create OTP record & email - short lived
    otp_code = generate_numeric_otp(6)
    expires_at = datetime.utcnow() + timedelta(minutes=12)
    otp = models.OTPVerification(user_id=user.id, otp_code=otp_code, expires_at=expires_at, is_used=False)
    db.add(otp)
    db.commit()

    try:
        send_email(user.email, "CorpGPT: Verify your email", f"Your verification OTP is: {otp_code}. It expires in 12 minutes.")
    except Exception as e:
        print("Email send failed:", e)

    log_action(user.id, "signup_requested", metadata=f"ip={request.client.host}")

    return {"message": "Signup request received. Check your email for OTP to verify your account."}


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
    db.add(otp)
    db.add(user)
    db.commit()

    log_action(user.id, "email_verified")
    return {"message": "Email verified successfully. Wait for admin approval if required."}


@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginIn, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified")
    if not user.is_approved:
        raise HTTPException(status_code=403, detail="Account not approved by admin")

    # If user has TOTP enabled, require it
    if user.totp_secret:
        if not payload.otp:
            raise HTTPException(status_code=428, detail="TOTP required")
        if not verify_totp(user.totp_secret, payload.otp):
            raise HTTPException(status_code=401, detail="Invalid TOTP")

    access = create_access_token(subject=user.id, extra={"role": user.role.value})
    refresh = create_refresh_token(subject=user.id)
    log_action(user.id, "login")
    return {"access_token": access, "refresh_token": refresh, "expires_in": None}
