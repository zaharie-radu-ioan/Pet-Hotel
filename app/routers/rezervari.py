from fastapi import APIRouter, Depends, HTTPException, status
from app.db import run_insert
from app.routers.auth import get_current_client_id

from app import schemas

router = APIRouter(prefix="/rezervari", tags=["rezervari"])


@router.post("", status_code=status.HTTP_201_CREATED)
def creeaza_rezervare(data: schemas.RezervareNoua, id_client: int = Depends(get_current_client_id)):
    if data.data_final < data.data_inceput:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "data_final trebuie să fie >= data_inceput"
        )

    id_rezervare = run_insert(
        "INSERT INTO rezervare (data_inceput, data_final, id_client) VALUES (?, ?, ?)",
        (data.data_inceput, data.data_final, id_client),
    )
    return {"status": "ceruta"}
