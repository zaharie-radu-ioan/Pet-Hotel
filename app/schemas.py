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

class ActivitateAnimalResponse(BaseModel):
    id_animal: int
    nume: str


class ActivitateCameraResponse(BaseModel):
    id_camera: int
    tip_camera: str


class ActivitateResponse(BaseModel):
    id_activitate: int
    tip_activitate: str
    ora_inceput: datetime
    ora_final: datetime | None
    status: str
    observatii: str | None
    animal: ActivitateAnimalResponse
    camera: ActivitateCameraResponse

class ActivitateStatusUpdate(BaseModel):
    status: str