import pyotp

def generate_otp_secret():
    return pyotp.random_base32()

def get_totp_uri(username: str, secret: str, issuer_name="EnterpriseAI"):
    return pyotp.totp.TOTP(secret).provisioning_uri(name=username, issuer_name=issuer_name)

def verify_totp(secret: str, token: str) -> bool:
    totp = pyotp.TOTP(secret)
    return totp.verify(token)
