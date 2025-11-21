from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

def hash_password(password: str) -> str:
    # Ensure clean Unicode string
    if isinstance(password, bytes):
        password = password.decode("utf-8")

    # bcrypt max limit fix
    password = password[:72]

    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    if isinstance(plain, bytes):
        plain = plain.decode("utf-8")

    plain = plain[:72]
    return pwd_context.verify(plain, hashed)
