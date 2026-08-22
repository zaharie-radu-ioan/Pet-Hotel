from pydantic import BaseModel, EmailStr, Field
from datetime import date, datetime, time
from decimal import Decimal
from typing import Literal

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


# ---------------------------------------------------------------- catalog

class IncludedService(BaseModel):
    name: str
    per_night: int


class PackagePublic(BaseModel):
    id: int
    name: str
    description: str | None = None
    price_per_night: Decimal
    included_services: list[IncludedService] = []


class RoomTypeAvailability(BaseModel):
    room_type: str
    price_per_night: Decimal
    rooms_free: int


# ----------------------------------------------------------- reservations

class NewStay(BaseModel):
    """One animal, in one room type, on one package."""
    animal_id: int
    room_type: str = Field(min_length=1, max_length=50)
    package_id: int
    feeding_times: list[time] = Field(min_length=3, max_length=3)


class NewReservation(BaseModel):
    start_date: date
    end_date: date
    stays: list[NewStay] = Field(min_length=1, max_length=10)


class StayPublic(BaseModel):
    animal: str
    room_type: str
    package: str | None = None
    room_price_per_night: Decimal
    package_price_per_night: Decimal = Decimal("0.00")


class ReservationPublic(BaseModel):
    code: str
    start_date: date
    end_date: date
    nights: int
    status: str
    total: Decimal
    created_at: datetime
    stays: list[StayPublic] = []


# --------------------------------------------------------- invoice/payment

class InvoiceLine(BaseModel):
    description: str
    quantity: int
    unit_price: Decimal
    amount: Decimal
    included_in_package: bool = False


class InvoicePublic(BaseModel):
    number: str
    issued_at: datetime
    status: str
    total: Decimal
    client: str
    reservation_code: str
    start_date: date
    end_date: date
    nights: int
    lines: list[InvoiceLine] = []
    payment_method: str | None = None
    paid_at: datetime | None = None


class NewPayment(BaseModel):
    method: Literal["card", "numerar", "transfer"]


# ------------------------------------------------------------------ profil

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


# -------------------------------------------------------------- activitati

class ActivitateAnimalResponse(BaseModel):
    id_animal: int | None
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
    animal: ActivitateAnimalResponse | None = None
    camera: ActivitateCameraResponse | None = None


class ActivitateStatusUpdate(BaseModel):
    status: str


class ActivitateCreate(BaseModel):
    tip_activitate: str
    ora_inceput: datetime
    ora_final: datetime | None = None
    observatii: str | None = None
    id_cazare: int | None = None
    id_angajat: int

class ActivitateUpdate(BaseModel):
    tip_activitate: str
    ora_inceput: datetime
    ora_final: datetime | None = None
    status: str
    observatii: str | None = None
    id_cazare: int | None = None
    id_angajat: int

# ----------------------------------------------------------------- animale

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


class AnimalUpdate(BaseModel):
    nume: str = Field(min_length=1, max_length=50)
    specie: str = Field(min_length=1, max_length=50)
    rasa: str | None = Field(default=None, max_length=100)
    sex: str | None = None
    data_nasterii: date | None = None
    greutate: Decimal | None = None
    sterilizat: bool = False
    observatii: str | None = None