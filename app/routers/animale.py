from fastapi import APIRouter, Depends, status
from app.db import run_select, run_select_one, run_insert, run_execute
from app.routers.auth import get_current_client_id
from app import schemas


router = APIRouter(prefix="/animale", tags=["animale"])


@router.get("", response_model=list[schemas.AnimalPublic])
def animalele_mele(id_client=Depends(get_current_client_id)):
    return run_select(
        "SELECT "
        "id_animal, nume, specie, rasa, sex, data_nasterii, "
        "greutate, sterilizat, observatii "
        "FROM animal "
        "WHERE id_client = ? "
        "ORDER BY id_animal",
        (id_client,),
        dictionary=True,
    )


@router.post("", response_model=schemas.AnimalPublic, status_code=status.HTTP_201_CREATED)
def adauga_animal(
    data: schemas.AnimalNou,
    id_client=Depends(get_current_client_id),
):
    id_animal = run_insert(
        "INSERT INTO animal "
        "(nume, specie, rasa, sex, data_nasterii, greutate, sterilizat, observatii, id_client) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            data.nume,
            data.specie,
            data.rasa,
            data.sex,
            data.data_nasterii,
            data.greutate,
            data.sterilizat,
            data.observatii,
            id_client,
        ),
    )
    return run_select_one(
            "SELECT "
            "id_animal, nume, specie, rasa, sex, data_nasterii, "
            "greutate, sterilizat, observatii "
            "FROM animal "
            "WHERE id_animal = ? AND id_client = ?",
            (id_animal, id_client),
            dictionary=True,
        )

@router.patch("/{id_animal}", response_model=schemas.AnimalPublic)
def modifica_animal(
    id_animal: int,
    data: schemas.AnimalUpdate,
    id_client=Depends(get_current_client_id),
):
    run_execute(
        "UPDATE animal "
        "SET nume = ?, specie = ?, rasa = ?, sex = ?, "
        "data_nasterii = ?, greutate = ?, sterilizat = ?, observatii = ? "
        "WHERE id_animal = ? AND id_client = ?",
        (
            data.nume,
            data.specie,
            data.rasa,
            data.sex,
            data.data_nasterii,
            data.greutate,
            data.sterilizat,
            data.observatii,
            id_animal,
            id_client,
        ),
    )


    return run_select_one(
        "SELECT "
        "id_animal, nume, specie, rasa, sex, data_nasterii, "
        "greutate, sterilizat, observatii "
        "FROM animal "
        "WHERE id_animal = ? AND id_client = ?",
        (id_animal, id_client),
        dictionary=True,
    )


@router.delete("/{id_animal}", status_code=status.HTTP_204_NO_CONTENT)
def sterge_animal(
    id_animal: int,
    id_client=Depends(get_current_client_id),
):
    run_execute(
        "DELETE FROM animal "
        "WHERE id_animal = ? AND id_client = ?",
        (id_animal, id_client),
    )