import uuid
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Response, status

from app import factura_pdf, schemas
from app.rezervari_utils import count_nights, invoice_number, package_contents, stay_range
from app.db import run_select, run_select_one, transaction
from app.routers.auth import get_current_client_id

router = APIRouter(prefix="/rezervari", tags=["rezervari"])

def load_stays(client_id):
    """Every stay of this client, with its room and its package."""
    stays = run_select(
        "SELECT z.id_cazare, z.id_rezervare, "
        "       z.nume_animal AS animal, "
        "       c.tip_camera AS room_type, "
        "       z.pret_camera_noapte AS room_price_per_night "
        "FROM cazare z "
        "JOIN rezervare r ON r.id_rezervare = z.id_rezervare "
        "JOIN camera c ON c.id_camera = z.id_camera "
        "WHERE r.id_client = ? "
        "ORDER BY z.id_cazare",
        (client_id,),
        dictionary=True,
    )

    # The package is a separate row in cazare_serviciu, so it is fetched on its
    # own and matched up in Python. One query each, then a simple merge.
    packages = run_select(
        "SELECT cs.id_cazare, s.denumire AS package, "
        "       cs.pret_aplicat AS package_price_per_night "
        "FROM cazare_serviciu cs "
        "JOIN serviciu s ON s.id_serviciu = cs.id_serviciu "
        "JOIN cazare z ON z.id_cazare = cs.id_cazare "
        "JOIN rezervare r ON r.id_rezervare = z.id_rezervare "
        "WHERE r.id_client = ? AND s.tip = 'pachet' AND cs.status <> 'anulat'",
        (client_id,),
        dictionary=True,
    )
    package_by_stay = {p["id_cazare"]: p for p in packages}

    for stay in stays:
        package = package_by_stay.get(stay["id_cazare"])
        stay["package"] = package["package"] if package else None
        stay["package_price_per_night"] = (
            package["package_price_per_night"] if package else Decimal("0.00")
        )
    return stays


def load_reservations(client_id, code=None):
    #Reservations of this client, newest first, with their stays attached.
    if code:
        reservations = run_select(
            "SELECT id_rezervare, cod, data_inceput, data_final, status, total, created_at "
            "FROM rezervare WHERE id_client = ? AND cod = ?",
            (client_id, code),
            dictionary=True,
        )
    else:
        reservations = run_select(
            "SELECT id_rezervare, cod, data_inceput, data_final, status, total, created_at "
            "FROM rezervare WHERE id_client = ? ORDER BY created_at DESC",
            (client_id,),
            dictionary=True,
        )

    stays = load_stays(client_id)
    result = []
    for r in reservations:
        result.append(
            {
                "code": r["cod"],
                "start_date": r["data_inceput"],
                "end_date": r["data_final"],
                "nights": count_nights(r["data_inceput"], r["data_final"]),
                "status": r["status"],
                "total": r["total"],
                "created_at": r["created_at"],
                "stays": [s for s in stays if s["id_rezervare"] == r["id_rezervare"]],
            }
        )
    return result


def find_reservation(code, client_id):
    #Raw reservation row, or 404. Used before anything that needs its id.
    reservation = run_select_one(
        "SELECT id_rezervare, cod, data_inceput, data_final, status, total, created_at "
        "FROM rezervare WHERE cod = ? AND id_client = ?",
        (code, client_id),
        dictionary=True,
    )
    if not reservation:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Reservation not found.")
    return reservation


def find_free_room(cur, room_type, check_in, check_out):
    cur.execute(
        "SELECT c.id_camera, c.pret_noapte "
        "FROM camera c "
        "WHERE c.tip_camera = ? AND c.status <> 'indisponibila' "
        "  AND NOT EXISTS ( "
        "      SELECT 1 FROM cazare z "
        "      JOIN rezervare r ON r.id_rezervare = z.id_rezervare "
        "      WHERE z.id_camera = c.id_camera "
        "        AND r.status <> 'anulata' "
        "        AND z.data_check_in < ? "
        "        AND z.data_check_out > ? "
        "  ) "
        "ORDER BY c.id_camera LIMIT 1 FOR UPDATE",
        (room_type, check_out, check_in),
    )
    return cur.fetchone()


def add_included_services(cur, stay_id, package, nights):
    for item in package_contents(package["continut"]):
        name = item.get("denumire")
        per_night = item.get("cantitate_pe_noapte", 1)
        if not name:
            continue

        cur.execute(
            "SELECT id_serviciu FROM serviciu "
            "WHERE denumire = ? AND tip = 'serviciu' AND activ = TRUE",
            (name,),
        )
        service = cur.fetchone()
        if not service:
            raise HTTPException(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                f"Package '{package['denumire']}' lists an unknown service: {name}",
            )

        cur.execute(
            "INSERT INTO cazare_serviciu (cantitate, pret_aplicat, id_cazare, id_serviciu) "
            "VALUES (?, 0.00, ?, ?)",
            (per_night * nights, stay_id, service["id_serviciu"]),
        )


@router.post("", response_model=schemas.ReservationPublic, status_code=status.HTTP_201_CREATED)
def create_reservation(
    data: schemas.NewReservation,
    client_id: int = Depends(get_current_client_id),
):
    if data.end_date <= data.start_date:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "A reservation needs at least one night."
        )
    if data.start_date < date.today():
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "The start date cannot be in the past."
        )

    animal_ids = [stay.animal_id for stay in data.stays]
    if len(set(animal_ids)) != len(animal_ids):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "The same animal is listed twice."
        )

    check_in, check_out = stay_range(data.start_date, data.end_date)
    nights = count_nights(data.start_date, data.end_date)
    code = str(uuid.uuid4())

    with transaction(dictionary=True) as cur:
        cur.execute(
            "INSERT INTO rezervare (cod, data_inceput, data_final, id_client) "
            "VALUES (?, ?, ?, ?)",
            (code, data.start_date, data.end_date, client_id),
        )
        reservation_id = cur.lastrowid
        total = Decimal("0.00")

        for stay in data.stays:
            #  The animal must belong to whoever is asking.
            cur.execute(
                "SELECT nume, specie, rasa "
                "FROM animal "
                "WHERE id_animal = ? AND id_client = ?",
                (stay.animal_id, client_id),
            )
            animal = cur.fetchone()

            if not animal:
                raise HTTPException(
                    status.HTTP_404_NOT_FOUND, "One of the selected animals was not found."
                )

            cur.execute(
                "SELECT id_serviciu, denumire, continut, pret_curent FROM serviciu "
                "WHERE id_serviciu = ? AND tip = 'pachet' AND activ = TRUE",
                (stay.package_id,),
            )
            package = cur.fetchone()
            if not package:
                raise HTTPException(
                    status.HTTP_404_NOT_FOUND,
                    f"The package chosen for {animal['nume']} is not available.",
                )

            # The animal cannot already be staying over the same dates.
            cur.execute(
                "SELECT 1 FROM cazare z "
                "JOIN rezervare r ON r.id_rezervare = z.id_rezervare "
                "WHERE z.id_animal = ? AND r.id_rezervare <> ? "
                "  AND r.status <> 'anulata' "
                "  AND z.data_check_in < ? AND z.data_check_out > ? "
                "LIMIT 1",
                (stay.animal_id, reservation_id, check_out, check_in),
            )
            if cur.fetchone():
                raise HTTPException(
                    status.HTTP_409_CONFLICT,
                    f"{animal['nume']} already has a stay over these dates.",
                )

            room = find_free_room(cur, stay.room_type, check_in, check_out)
            if not room:
                raise HTTPException(
                    status.HTTP_409_CONFLICT,
                    f"No '{stay.room_type}' rooms left for these dates.",
                )

            cur.execute(
                "INSERT INTO cazare "
                "(data_check_in, data_check_out, pret_camera_noapte, "
                " id_rezervare, id_animal, nume_animal, specie_animal, rasa_animal, id_camera) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    check_in,
                    check_out,
                    room["pret_noapte"],
                    reservation_id,
                    stay.animal_id,
                    animal["nume"],
                    animal["specie"],
                    animal["rasa"],
                    room["id_camera"],
                ),
            )
            stay_id = cur.lastrowid

            cur.execute(
                "INSERT INTO cazare_serviciu (cantitate, pret_aplicat, id_cazare, id_serviciu) "
                "VALUES (?, ?, ?, ?)",
                (nights, package["pret_curent"], stay_id, package["id_serviciu"]),
            )

            add_included_services(cur, stay_id, package, nights)

            total += (room["pret_noapte"] + package["pret_curent"]) * nights

        cur.execute(
            "UPDATE rezervare SET total = ? WHERE id_rezervare = ?",
            (total, reservation_id),
        )

    return load_reservations(client_id, code)[0]


@router.get("", response_model=list[schemas.ReservationPublic])
def list_reservations(client_id: int = Depends(get_current_client_id)):
    return load_reservations(client_id)


@router.get("/{code}", response_model=schemas.ReservationPublic)
def get_reservation(code: str, client_id: int = Depends(get_current_client_id)):
    find_reservation(code, client_id)
    return load_reservations(client_id, code)[0]


@router.get("/{code}/factura", response_model=schemas.InvoicePublic)
def get_invoice(code: str, client_id: int = Depends(get_current_client_id)):
    reservation = find_reservation(code, client_id)
    reservation_id = reservation["id_rezervare"]
    nights = count_nights(reservation["data_inceput"], reservation["data_final"])

    client = run_select_one(
        "SELECT CONCAT(prenume, ' ', nume) AS full_name FROM client WHERE id_client = ?",
        (client_id,),
        dictionary=True,
    )

    stays = [
        s for s in load_stays(client_id) if s["id_rezervare"] == reservation_id
    ]

    services = run_select(
        "SELECT cs.id_cazare, s.denumire, cs.cantitate, cs.pret_aplicat "
        "FROM cazare_serviciu cs "
        "JOIN cazare z ON z.id_cazare = cs.id_cazare "
        "JOIN serviciu s ON s.id_serviciu = cs.id_serviciu "
        "WHERE z.id_rezervare = ? AND cs.status <> 'anulat' AND s.tip = 'serviciu' "
        "ORDER BY cs.id_cazare, (cs.pret_aplicat > 0), s.denumire",
        (reservation_id,),
        dictionary=True,
    )

    lines = []
    for stay in stays:
        lines.append(
            {
                "description": f"Stay for {stay['animal']} - {stay['room_type']} room",
                "quantity": nights,
                "unit_price": stay["room_price_per_night"],
                "amount": stay["room_price_per_night"] * nights,
                "included_in_package": False,
            }
        )
        if stay["package"]:
            lines.append(
                {
                    "description": f"{stay['package']} - {stay['animal']}",
                    "quantity": nights,
                    "unit_price": stay["package_price_per_night"],
                    "amount": stay["package_price_per_night"] * nights,
                    "included_in_package": False,
                }
            )
        for service in services:
            if service["id_cazare"] != stay["id_cazare"]:
                continue
            lines.append(
                {
                    "description": f"{service['denumire']} - {stay['animal']}",
                    "quantity": service["cantitate"],
                    "unit_price": service["pret_aplicat"],
                    "amount": service["pret_aplicat"] * service["cantitate"],
                    "included_in_package": service["pret_aplicat"] == 0,
                }
            )

    payment = run_select_one(
        "SELECT metoda, data_platii FROM plata "
        "WHERE id_rezervare = ? AND status = 'confirmata' "
        "ORDER BY data_platii DESC LIMIT 1",
        (reservation_id,),
        dictionary=True,
    )
    if reservation["status"] == "anulata":
        invoice_status = "cancelled"
    elif payment:
        invoice_status = "paid"
    else:
        invoice_status = "issued"

    return {
        "number": invoice_number(reservation_id, reservation["created_at"]),
        "issued_at": reservation["created_at"],
        "status": invoice_status,
        "total": reservation["total"],
        "client": client["full_name"] if client else "",
        "reservation_code": reservation["cod"],
        "start_date": reservation["data_inceput"],
        "end_date": reservation["data_final"],
        "nights": nights,
        "lines": lines,
        "payment_method": payment["metoda"] if payment else None,
        "paid_at": payment["data_platii"] if payment else None,
    }



@router.get("/{code}/factura/pdf")
def get_invoice_pdf(code: str, client_id: int = Depends(get_current_client_id)):
    invoice = get_invoice(code, client_id)
    pdf = factura_pdf.generate_pdf(invoice)
    filename = f"Invoice_{invoice['number']}.pdf"
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/{code}/plata", response_model=schemas.InvoicePublic)
def pay_reservation(
    code: str,
    data: schemas.NewPayment,
    client_id: int = Depends(get_current_client_id),
):
    reservation = find_reservation(code, client_id)
    if reservation["status"] == "anulata":
        raise HTTPException(status.HTTP_409_CONFLICT, "This reservation is cancelled.")
    if reservation["total"] <= 0:
        raise HTTPException(status.HTTP_409_CONFLICT, "This reservation has no amount due.")

    with transaction(dictionary=True) as cur:
        cur.execute(
            "SELECT total FROM rezervare WHERE id_rezervare = ? FOR UPDATE",
            (reservation["id_rezervare"],),
        )
        cur.execute(
            "SELECT 1 FROM plata WHERE id_rezervare = ? AND status = 'confirmata' LIMIT 1",
            (reservation["id_rezervare"],),
        )
        if cur.fetchone():
            raise HTTPException(status.HTTP_409_CONFLICT, "This reservation is already paid.")

        cur.execute(
            "INSERT INTO plata (suma, metoda, status, id_rezervare) "
            "VALUES (?, ?, 'confirmata', ?)",
            (reservation["total"], data.method, reservation["id_rezervare"]),
        )
        cur.execute(
            "UPDATE rezervare SET status = 'confirmata' "
            "WHERE id_rezervare = ? AND status = 'ceruta'",
            (reservation["id_rezervare"],),
        )

    return get_invoice(code, client_id)