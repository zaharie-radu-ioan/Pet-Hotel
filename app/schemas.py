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


class RezervarePublic(BaseModel):
    data_inceput: date
    data_final: date
    status: str
    total: Decimal
    created_at: datetime


class ProfilPublic(BaseModel):
    email: EmailStr
    nume: str
    prenume: str
    telefon: str | None = None
    adresa: str | None = None


class ProfilUpdate(BaseModel):
    nume: str = Field(min_length=1)
    prenume: str = Field(min_length=1)
    telefon: str | None = None
    adresa: str | None = None


class AnimalPublic(BaseModel):
    id_animal: int
    nume: str
    specie: str
    rasa: str | None = None
    sex: str | None = None
    data_nasterii: date | None = None
    greutate: Decimal | None = None
    sterilizat: bool
    observatii: str | None = None


class AnimalNou(BaseModel):
    nume: str = Field(min_length=1, max_length=50)
    specie: str = Field(min_length=1, max_length=50)
    rasa: str | None = Field(default=None, max_length=100)
    sex: str | None = None
    data_nasterii: date | None = None
    greutate: Decimal | None = None
    sterilizat: bool = False
    observatii: str | None = None