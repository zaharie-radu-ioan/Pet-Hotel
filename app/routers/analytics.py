from fastapi import APIRouter, Depends
from app.db import run_select, run_select_one
from app.routers.auth import get_current_admin

router = APIRouter(
    prefix="/analytics",
    tags=["Business Intelligence"]
)


@router.get("/kpis")
def get_kpis(admin=Depends(get_current_admin)):
    data = run_select_one(
        """
        SELECT
            COUNT(*) AS total_rezervari,
            COALESCE(SUM(total),0) AS venit_total,
            COALESCE(AVG(total),0) AS valoare_medie
        FROM rezervare
        WHERE status <> 'anulata'
        """,
        dictionary=True
    )

    return {
        "totalReservations": data["total_rezervari"],
        "totalRevenue": float(data["venit_total"]),
        "averageReservation": round(float(data["valoare_medie"]), 2)
    }


@router.get("/reservations")
def reservations(admin=Depends(get_current_admin)):
    return run_select(
        """
        SELECT
            DATE_FORMAT(created_at,'%Y-%m') AS month,
            COUNT(*) AS reservations,
            SUM(total) AS revenue
        FROM rezervare
        WHERE status <> 'anulata'
        GROUP BY DATE_FORMAT(created_at,'%Y-%m')
        ORDER BY month
        """,
        dictionary=True
    )


@router.get("/services")
def services(admin=Depends(get_current_admin)):
    return run_select(
        """
        SELECT
            s.denumire AS service,
            COUNT(*) AS bookings,
            SUM(cs.cantitate * cs.pret_aplicat) AS revenue
        FROM cazare_serviciu cs
        JOIN serviciu s
            ON s.id_serviciu = cs.id_serviciu
        JOIN cazare z
            ON z.id_cazare = cs.id_cazare
        JOIN rezervare r
            ON r.id_rezervare = z.id_rezervare
        WHERE
            cs.status <> 'anulat'
            AND r.status <> 'anulata'
            AND s.tip='serviciu'
        GROUP BY s.id_serviciu,s.denumire
        ORDER BY bookings DESC
        """,
        dictionary=True
    )

@router.get("/payments")
def payments(admin=Depends(get_current_admin)):
    return run_select(
        """
        SELECT
            metoda,
            COUNT(*) AS payments,
            SUM(suma) AS total
        FROM plata
        WHERE status='confirmata'
        GROUP BY metoda
        ORDER BY total DESC
        """,
        dictionary=True
    )