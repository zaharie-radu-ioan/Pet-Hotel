import uuid
from datetime import datetime, timedelta, timezone

import mariadb
from fastapi import (
    APIRouter, Depends, HTTPException, Header, Request, Response, Cookie, status,
)

from app import security, config, schemas
from app.db import run_select_one, run_execute, transaction
from app.limiter import limiter

router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE = "refresh_token"

def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)

def set_refresh_cookie(response, raw_token):
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=raw_token,
        httponly=True,
        secure=config.COOKIE_SECURE,
        samesite="strict",
        path="/auth",
        max_age=config.REFRESH_TOKEN_DAYS * 24 * 3600,
    )

def issue_refresh(cursor, id_utilizator, id_familie):
    raw = security.new_refresh_token()
    expira = utcnow() + timedelta(days=config.REFRESH_TOKEN_DAYS)
    cursor.execute(
        "INSERT INTO token_reinnoire (id_utilizator, hash_token, id_familie, expira_la) "
        "VALUES (?, ?, ?, ?)",(id_utilizator, security.hash_token(raw), id_familie, expira),
    )
    return raw

@router.post("/register", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(request: Request, data: schemas.RegisterRequest):
    hashed = security.hash_password(data.password)
    try:
        with transaction() as c:
            c.execute(
                "INSERT INTO utilizator (email, parola, rol) VALUES (?, ?, 'client')",
                (data.email, hashed),
            )
            id_utilizator = c.lastrowid
            c.execute(
                "INSERT INTO client (id_utilizator, nume, prenume, telefon, adresa) "
                "VALUES (?, ?, ?, ?, ?)",
                (id_utilizator, data.nume, data.prenume, data.telefon, data.adresa),
            )
    except mariadb.IntegrityError:
        raise HTTPException(status.HTTP_409_CONFLICT, "Există deja un cont cu acest email")

    return {"detail": "Cont creat"}

@router.post("/login", response_model=schemas.TokenResponse)
@limiter.limit("5/minute")
def login(request: Request, creds: schemas.LoginRequest, response: Response):
    user = run_select_one(
        "SELECT id_utilizator, parola, rol, activ FROM utilizator WHERE email = ?",
        (creds.email,),
        dictionary=True,
    )

    hashed = user["parola"] if user else security.DUMMY_HASH
    password_ok = security.verify_password(creds.password, hashed)

    if not user or not password_ok:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Email sau parolă incorecte")
    if not user["activ"]:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Cont dezactivat")

    id_familie = str(uuid.uuid4())
    with transaction() as c:
        raw_refresh = issue_refresh(c, user["id_utilizator"], id_familie)

    set_refresh_cookie(response, raw_refresh)
    return {
        "access_token": security.create_access_token(user["id_utilizator"], user["rol"]),
        "token_type": "bearer",
        "rol": user["rol"],
    }

@router.post("/refresh", response_model=schemas.TokenResponse)
def refresh(response: Response, refresh_token: str = Cookie(default=None)):
    if not refresh_token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Lipsă refresh token")

    token_hash = security.hash_token(refresh_token)
    row = run_select_one(
        "SELECT t.id_utilizator, t.id_familie, t.revocat, t.expira_la, u.rol, u.activ "
        "FROM token_reinnoire t "
        "JOIN utilizator u ON u.id_utilizator = t.id_utilizator "
        "WHERE t.hash_token = ?",
        (token_hash,),
        dictionary=True,
    )
    if not row:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token invalid")

    if row["revocat"]:
        run_execute(
            "UPDATE token_reinnoire SET revocat = TRUE WHERE id_familie = ?",
            (row["id_familie"],),
        )
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Sesiune compromisă, autentifică-te din nou"
        )

    if row["expira_la"] < utcnow():
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token expirat")
    if not row["activ"]:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Cont dezactivat")

    with transaction() as c:
        c.execute(
            "UPDATE token_reinnoire SET revocat = TRUE WHERE hash_token = ?",
            (token_hash,),
        )
        raw_refresh = issue_refresh(c, row["id_utilizator"], row["id_familie"])

    set_refresh_cookie(response, raw_refresh)
    return {
        "access_token": security.create_access_token(row["id_utilizator"], row["rol"]),
        "token_type": "bearer",
        "rol": row["rol"],
    }

@router.post("/logout")
def logout(response: Response, refresh_token: str = Cookie(default=None)):
    if refresh_token:
        run_execute(
            "UPDATE token_reinnoire SET revocat = TRUE WHERE hash_token = ?",
            (security.hash_token(refresh_token),),
        )
    response.delete_cookie(REFRESH_COOKIE, path="/auth")
    return {"detail": "Delogat"}

def get_current_user(authorization: str = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Neautentificat")
    payload = security.decode_access_token(authorization.split(" ", 1)[1])
    if not payload:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token invalid sau expirat")
    return {"id_utilizator": int(payload["sub"]), "rol": payload["rol"]}

def get_current_client_id(user=Depends(get_current_user)):
    row = run_select_one(
        "SELECT id_client FROM client WHERE id_utilizator = ?",
        (user["id_utilizator"],),
        dictionary=True,
    )
    if not row:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Contul nu are profil de client")
    return row["id_client"]

@router.get("/me", response_model=schemas.UserPublic)
def me(user=Depends(get_current_user)):
    return user