from pydantic import BaseModel, EmailStr, Field
from datetime import date, datetime
from decimal import Decimal

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    nume: str
    prenume: str
    telefon: str | None = None
    adresa: str | None = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    rol: str

class UserPublic(BaseModel):
    id_utilizator: int
    rol: str

class RezervareNoua(BaseModel):
    data_inceput: date
    data_final: date