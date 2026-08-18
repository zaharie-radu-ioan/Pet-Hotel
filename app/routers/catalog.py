from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app import schemas
from app.rezervari_utils import package_contents, stay_range
from app.db import run_select
router = APIRouter(tags=["catalog"])


@router.get("/pachete", response_model=list[schemas.PackagePublic])
def list_packages():
    rows = run_select(
        "SELECT id_serviciu, denumire, descriere, continut, pret_curent "
        "FROM serviciu WHERE tip = 'pachet' AND activ = TRUE "
        "ORDER BY pret_curent",
        (),
        dictionary=True,
    )

    packages = []
    for row in rows:
        included = []
        for item in package_contents(row["continut"]):
            included.append(
                {
                    "name": item.get("denumire", ""),
                    "per_night": item.get("cantitate_pe_noapte", 1),
                }
            )
        packages.append(
            {
                "id": row["id_serviciu"],
                "name": row["denumire"],
                "description": row["descriere"],
                "price_per_night": row["pret_curent"],
                "included_services": included,
            }
        )
    return packages


@router.get("/disponibilitate", response_model=list[schemas.RoomTypeAvailability])
def room_availability(
    start_date: date = Query(...),
    end_date: date = Query(...),
):
    """How many rooms of each type are free for the whole stay.
    Only a preview for the UI. It can go stale, so the booking
    endpoint checks availability again before it saves anything.
    """
    if end_date <= start_date:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "A reservation needs at least one night."
        )

    check_in, check_out = stay_range(start_date, end_date)

    return run_select(
        "SELECT c.tip_camera AS room_type, "
        "       MIN(c.pret_noapte) AS price_per_night, "
        "       COUNT(*) AS rooms_free "
        "FROM camera c "
        "WHERE c.status <> 'indisponibila' "
        "  AND NOT EXISTS ( "
        "      SELECT 1 FROM cazare z "
        "      JOIN rezervare r ON r.id_rezervare = z.id_rezervare "
        "      WHERE z.id_camera = c.id_camera "
        "        AND r.status <> 'anulata' "
        "        AND z.data_check_in < ? "
        "        AND z.data_check_out > ? "
        "  ) "
        "GROUP BY c.tip_camera "
        "ORDER BY price_per_night",
        (check_out, check_in),
        dictionary=True,
    )