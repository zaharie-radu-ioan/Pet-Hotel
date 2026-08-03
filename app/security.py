import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from passlib.context import CryptContext
from jose import jwt, JWTError

from app import config

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"

DUMMY_HASH = pwd_context.hash("dummy-password-a76ada78912aa")


def hash_password(password):
    return pwd_context.hash(password)


def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def create_access_token(id_utilizator, rol):
    expire = datetime.now(timezone.utc) + timedelta(minutes=config.ACCESS_TOKEN_MINUTES)
    payload = {"sub": str(id_utilizator), "rol": rol, "exp": expire}
    return jwt.encode(payload, config.JWT_SECRET, algorithm=ALGORITHM)


def decode_access_token(token):
    try:
        return jwt.decode(token, config.JWT_SECRET, algorithms=[ALGORITHM])
    except JWTError:
        return None

def new_refresh_token():
    return secrets.token_urlsafe(48)

def hash_token(raw):
    return hashlib.sha256(raw.encode()).hexdigest()