from cryptography.fernet import Fernet
import os
from ..config import FERNET_KEY, UPLOAD_DIR

# helper to ensure there's a key in env during dev
def _get_fernet():
    key = FERNET_KEY
    if not key:
        # Warning: in production, set a real key and never generate automatically
        key = Fernet.generate_key().decode()
    return Fernet(key.encode() if isinstance(key, str) else key)

def save_encrypted_file(file_bytes: bytes, filename: str) -> str:
    f = _get_fernet()
    token = f.encrypt(file_bytes)
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as fh:
        fh.write(token)
    return path

def read_decrypted_file(path: str) -> bytes:
    f = _get_fernet()
    with open(path, "rb") as fh:
        token = fh.read()
    return f.decrypt(token)
