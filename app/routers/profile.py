from fastapi import APIRouter, Depends, HTTPException, status
from app.db import run_select_one, run_execute
from app.routers.auth import get_current_user

from app import schemas

router = APIRouter(prefix="/profil", tags=["profil"])


def _incarca_profil(id_utilizator):
    return run_select_one(
        "SELECT u.email, c.nume, c.prenume, c.telefon, c.adresa "
        "FROM utilizator u "
        "JOIN client c ON c.id_utilizator = u.id_utilizator "
        "WHERE u.id_utilizator = ?",
        (id_utilizator,),
        dictionary=True,
    )


@router.get("", response_model=schemas.ProfilPublic)
def profilul_meu(user=Depends(get_current_user)):
    row = _incarca_profil(user["id_utilizator"])
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Profil de client inexistent")
    return row


@router.patch("", response_model=schemas.ProfilPublic)
def actualizeaza_profil(data: schemas.ProfilUpdate, user=Depends(get_current_user)):
    run_execute(
        "UPDATE client SET nume = ?, prenume = ?, telefon = ?, adresa = ? "
        "WHERE id_utilizator = ?",
        (data.nume, data.prenume, data.telefon, data.adresa, user["id_utilizator"]),
    )

    row = _incarca_profil(user["id_utilizator"])
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Profil de client inexistent")
    return row