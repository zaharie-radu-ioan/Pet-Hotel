from fastapi import APIRouter, Depends, HTTPException

from app.db import run_select, run_select_one, run_execute, run_insert
from app.routers.auth import get_current_employee, get_current_admin
from app.schemas import ActivitateResponse, ActivitateStatusUpdate, ActivitateCreate


router = APIRouter(
    prefix="/activitati",
    tags=["Activitati"],
)


@router.get("/me", response_model=list[ActivitateResponse])
def get_my_activities(
    current_user=Depends(get_current_employee),
):
    sql = """
        SELECT
            a.id_activitate,
            a.tip_activitate,
            a.ora_inceput,
            a.ora_final,
            a.status,
            a.observatii,

            an.id_animal,
            an.nume AS animal_nume,

            c.id_camera,
            c.tip_camera

        FROM activitate a

        JOIN angajat ang
            ON a.id_angajat = ang.id_angajat

        JOIN utilizator u
            ON ang.id_utilizator = u.id_utilizator

        JOIN cazare cz
            ON a.id_cazare = cz.id_cazare

        JOIN animal an
            ON cz.id_animal = an.id_animal

        JOIN camera c
            ON cz.id_camera = c.id_camera

        WHERE u.id_utilizator = ?

        ORDER BY a.ora_inceput ASC
    """

    rows = run_select(
        sql,
        (current_user["id_utilizator"],),
        dictionary=True,
    )

    return [
        {
            "id_activitate": row["id_activitate"],
            "tip_activitate": row["tip_activitate"],
            "ora_inceput": row["ora_inceput"],
            "ora_final": row["ora_final"],
            "status": row["status"],
            "observatii": row["observatii"],
            "animal": {
                "id_animal": row["id_animal"],
                "nume": row["animal_nume"],
            },
            "camera": {
                "id_camera": row["id_camera"],
                "tip_camera": row["tip_camera"],
            },
        }
        for row in rows
    ]

@router.patch("/{id_activitate}/status")
def update_activity_status(
    id_activitate: int,
    data: ActivitateStatusUpdate,
    current_user=Depends(get_current_employee),
):
    allowed_statuses = {
        "planificata",
        "in_curs",
        "finalizata",
        "anulata",
    }

    if data.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Status invalid: planificata, in_curs, finalizata, anulata",
        )

    activity = run_select_one(
        """
        SELECT
            a.id_activitate,
            a.status,
            ang.id_angajat
        FROM activitate a
        JOIN angajat ang
            ON a.id_angajat = ang.id_angajat
        WHERE a.id_activitate = ?
          AND ang.id_utilizator = ?
        """,
        (
            id_activitate,
            current_user["id_utilizator"],
        ),
        dictionary=True,
    )

    if not activity:
        raise HTTPException(
            status_code=404,
            detail="Activitate inexistenta pentru angajat",
        )

    if activity["status"] == "finalizata":
        raise HTTPException(
            status_code=400,
            detail="O activitate finalizata nu mai poate fi modificata",
        )

    if data.status == "finalizata":
        run_execute(
            """
            UPDATE activitate
            SET
                status = ?,
                finalizat_la = NOW()
            WHERE id_activitate = ?
            """,
            (
                data.status,
                id_activitate,
            ),
        )
    else:
        run_execute(
            """
            UPDATE activitate
            SET
                status = ?,
                finalizat_la = NULL
            WHERE id_activitate = ?
            """,
            (
                data.status,
                id_activitate,
            ),
        )

    return {
        "message": "Status activitate actualizat",
        "id_activitate": id_activitate,
        "status": data.status,
    }

@router.post("/", status_code=201)
def create_activity(
    data: ActivitateCreate,
    current_user=Depends(get_current_admin),
):
    if data.ora_final is not None and data.ora_final < data.ora_inceput:
        raise HTTPException(
            status_code=400,
            detail="Ora finala trebuie sa fie dupa ora de inceput.",
        )

    employee = run_select_one(
        """
        SELECT id_angajat
        FROM angajat
        WHERE id_angajat = ?
        """,
        (data.id_angajat,),
        dictionary=True,
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Angajatul nu exista.",
        )

    cazare = run_select_one(
        """
        SELECT
            id_cazare,
            id_animal,
            id_camera
        FROM cazare
        WHERE id_cazare = ?
        """,
        (data.id_cazare,),
        dictionary=True,
    )

    if not cazare:
        raise HTTPException(
            status_code=404,
            detail="Cazarea nu exista.",
        )

    id_activitate = run_insert(
        """
        INSERT INTO activitate (
            tip_activitate,
            ora_inceput,
            ora_final,
            status,
            observatii,
            id_cazare,
            id_angajat,
            id_creat_de
        )
        VALUES (?, ?, ?, 'planificata', ?, ?, ?, ?)
        """,
        (
            data.tip_activitate,
            data.ora_inceput,
            data.ora_final,
            data.observatii,
            data.id_cazare,
            data.id_angajat,
            current_user["id_utilizator"],
        ),
    )

    return {
        "message": "Activitatea a fost creata si asignata.",
        "id_activitate": id_activitate,
    }