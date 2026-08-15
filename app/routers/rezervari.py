from fastapi import APIRouter, Depends, HTTPException, status
from app.db import run_insert , run_select, run_select_one
from app.routers.auth import get_current_client_id

from app import schemas

router = APIRouter(prefix="/rezervari", tags=["rezervari"])


@router.post("", status_code=status.HTTP_201_CREATED)
def creeaza_rezervare(data: schemas.RezervareNoua, id_client: int = Depends(get_current_client_id)):
    if data.data_final < data.data_inceput:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "data_final trebuie să fie >= data_inceput"
        )
    conflict = run_select_one(
        "SELECT 1 FROM rezervare "
        "WHERE id_client = ? AND status <> 'anulata' "
        "AND data_inceput <= ? AND data_final >= ? LIMIT 1",
        (id_client, data.data_final, data.data_inceput),
    )
    if conflict:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Ai deja o rezervare in acest interval"
        )
    id_rezervare = run_insert(
        "INSERT INTO rezervare (data_inceput, data_final, id_client) VALUES (?, ?, ?)",
        (data.data_inceput, data.data_final, id_client),
    )
    return {"status": "ceruta"}


@router.get("", response_model=list[schemas.RezervarePublic])
def listeaza_rezervari(id_client: int = Depends(get_current_client_id)):
    return run_select(
        "SELECT data_inceput, data_final, status, total, created_at "
        "FROM rezervare WHERE id_client = ? ORDER BY created_at DESC",
        (id_client,),
        dictionary=True,
    )