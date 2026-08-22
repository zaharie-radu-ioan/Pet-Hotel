from fastapi import APIRouter, Depends, HTTPException

from app.db import run_select, run_select_one, run_execute, run_insert
from app.routers.auth import get_current_employee, get_current_admin
from app.schemas import ActivitateResponse, ActivitateStatusUpdate, ActivitateCreate, ActivitateUpdate


router = APIRouter(
    prefix="/activitati",
    tags=["activitati"],
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

            cz.id_animal,
            cz.nume_animal AS animal_nume,

            c.id_camera,
            c.tip_camera

        FROM activitate a

        JOIN angajat ang
            ON a.id_angajat = ang.id_angajat

        JOIN utilizator u
            ON ang.id_utilizator = u.id_utilizator

        LEFT JOIN cazare cz
            ON a.id_cazare = cz.id_cazare


        LEFT JOIN camera c
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
            "animal": (
                {
                    "id_animal": row["id_animal"],
                    "nume": row["animal_nume"],
                }
                if row["animal_nume"] is not None
                else None
            ),
            "camera": (
                {
                    "id_camera": row["id_camera"],
                    "tip_camera": row["tip_camera"],
                }
                if row["id_camera"] is not None
                else None
            ),
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

# partea asta pentru admini doar

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

    if data.id_cazare is not None:
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

@router.get("/admin/angajati")
def get_employees(
    current_user=Depends(get_current_admin),
):
    employees = run_select(
        """
        SELECT
            a.id_angajat,
            a.nume,
            a.prenume,
            a.telefon,
            a.id_utilizator
        FROM angajat a
        JOIN utilizator u
            ON a.id_utilizator = u.id_utilizator
        WHERE u.rol = 'angajat'
          AND u.activ = 1
        ORDER BY a.nume ASC, a.prenume ASC
        """,
        dictionary=True,
    )

    return employees

@router.get("/admin/angajat/{id_angajat}")
def get_activities_for_employee(
    id_angajat: int,
    current_user=Depends(get_current_admin),
):
    employee = run_select_one(
        """
        SELECT
            id_angajat,
            nume,
            prenume,
            telefon
        FROM angajat
        WHERE id_angajat = ?
        """,
        (id_angajat,),
        dictionary=True,
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Angajatul nu exista.",
        )

    rows = run_select(
        """
        SELECT
            a.id_activitate,
            a.tip_activitate,
            a.ora_inceput,
            a.ora_final,
            a.status,
            a.observatii,
            a.id_cazare,
            cz.id_animal,
            cz.nume_animal AS animal_nume,
            c.id_camera,
            c.tip_camera
        FROM activitate a
        LEFT JOIN cazare cz
            ON a.id_cazare = cz.id_cazare
        LEFT JOIN camera c
            ON cz.id_camera = c.id_camera
        WHERE a.id_angajat = ?
        ORDER BY a.ora_inceput ASC
        """,
        (id_angajat,),
        dictionary=True,
    )

    return {
        "angajat": {
            "id_angajat": employee["id_angajat"],
            "nume": employee["nume"],
            "prenume": employee["prenume"],
            "telefon": employee["telefon"],
        },
        "activitati": [
            {
                "id_activitate": row["id_activitate"],
                "tip_activitate": row["tip_activitate"],
                "ora_inceput": row["ora_inceput"],
                "ora_final": row["ora_final"],
                "status": row["status"],
                "observatii": row["observatii"],
                "id_cazare": row["id_cazare"],
                "animal": (
                    {
                        "id_animal": row["id_animal"],
                        "nume": row["animal_nume"],
                    }
                    if row["animal_nume"] is not None
                    else None
                ),
                "camera": (
                    {
                        "id_camera": row["id_camera"],
                        "tip_camera": row["tip_camera"],
                    }
                    if row["id_camera"] is not None
                    else None
                ),
            }
            for row in rows
        ],
    }

@router.delete("/admin/{id_activitate}")
def delete_activity(
    id_activitate: int,
    current_user=Depends(get_current_admin),
):
    activity = run_select_one(
        """
        SELECT
            id_activitate,
            id_cazare,
            id_angajat
        FROM activitate
        WHERE id_activitate = ?
        """,
        (id_activitate,),
        dictionary=True,
    )

    if not activity:
        raise HTTPException(
            status_code=404,
            detail="Activitatea nu exista.",
        )

    run_execute(
        """
        DELETE FROM activitate
        WHERE id_activitate = ?
        """,
        (id_activitate,),
    )

    return {
        "message": "Activitatea a fost stearsa.",
        "id_activitate": id_activitate,
    }

@router.patch("/admin/{id_activitate}")
def update_activity(
    id_activitate: int,
    data: ActivitateUpdate,
    current_user=Depends(get_current_admin),
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

    if data.ora_final is not None and data.ora_final < data.ora_inceput:
        raise HTTPException(
            status_code=400,
            detail="Ora finala trebuie sa fie dupa ora de inceput.",
        )

    activity = run_select_one(
        """
        SELECT id_activitate
        FROM activitate
        WHERE id_activitate = ?
        """,
        (id_activitate,),
        dictionary=True,
    )

    if not activity:
        raise HTTPException(
            status_code=404,
            detail="Activitatea nu exista.",
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

    if data.id_cazare is not None:
        cazare = run_select_one(
            """
            SELECT id_cazare
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

    run_execute(
        """
        UPDATE activitate
        SET
            tip_activitate = ?,
            ora_inceput = ?,
            ora_final = ?,
            status = ?,
            observatii = ?,
            id_cazare = ?,
            id_angajat = ?
        WHERE id_activitate = ?
        """,
        (
            data.tip_activitate,
            data.ora_inceput,
            data.ora_final,
            data.status,
            data.observatii,
            data.id_cazare,
            data.id_angajat,
            id_activitate,
        ),
    )

    return {
        "message": "Activitatea a fost actualizata.",
        "id_activitate": id_activitate,
        "status": data.status,
    }


@router.get("/admin")
def get_all_activities(
    current_user=Depends(get_current_admin),
):
    rows = run_select(
        """
        SELECT
            a.id_activitate,
            a.tip_activitate,
            a.ora_inceput,
            a.ora_final,
            a.status,
            a.observatii,
            a.id_cazare,

            ang.id_angajat,
            ang.nume AS angajat_nume,
            ang.prenume AS angajat_prenume,

            cz.id_animal,
            cz.nume_animal AS animal_nume,

            c.id_camera,
            c.tip_camera

        FROM activitate a

        LEFT JOIN angajat ang
            ON a.id_angajat = ang.id_angajat

        LEFT JOIN cazare cz
            ON a.id_cazare = cz.id_cazare

        LEFT JOIN camera c
            ON cz.id_camera = c.id_camera

        ORDER BY a.ora_inceput ASC
        """,
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
            "id_cazare": row["id_cazare"],

            "angajat": (
                {
                    "id_angajat": row["id_angajat"],
                    "nume": row["angajat_nume"],
                    "prenume": row["angajat_prenume"],
                }
                if row["id_angajat"] is not None
                else None
            ),

            "animal": (
                {
                    "id_animal": row["id_animal"],
                    "nume": row["animal_nume"],
                }
                if row["animal_nume"] is not None
                else None
            ),

            "camera": (
                {
                    "id_camera": row["id_camera"],
                    "tip_camera": row["tip_camera"],
                }
                if row["id_camera"] is not None
                else None
            ),
        }
        for row in rows
    ]