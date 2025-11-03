import random
from datetime import datetime, timedelta
import pyotp
import smtplib
from email.message import EmailMessage
from ..config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM

def generate_numeric_otp(length: int = 6) -> str:
    return "".join(str(random.randint(0,9)) for _ in range(length))

def send_email(to_email: str, subject: str, body: str):
    if not SMTP_HOST or not SMTP_USER or not SMTP_PASSWORD:
        # In dev fallback: print to console
        print(f"[EMAIL NOT CONFIGURED] To: {to_email} Subject: {subject}\n{body}")
        return
    msg = EmailMessage()
    msg["From"] = EMAIL_FROM
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
        s.starttls()
        s.login(SMTP_USER, SMTP_PASSWORD)
        s.send_message(msg)

def generate_totp_secret():
    return pyotp.random_base32()

def verify_totp(secret: str, token: str) -> bool:
    totp = pyotp.TOTP(secret, digits=6)
    return totp.verify(token, valid_window=1)
