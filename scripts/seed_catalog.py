
import json
from decimal import Decimal

from app.db import transaction

ROOM_TYPES = [
    {"prefix": "S", "type": "standard", "price": Decimal("80.00"), "count": 6},
    {"prefix": "D", "type": "deluxe", "price": Decimal("130.00"), "count": 4},
    {"prefix": "P", "type": "suite", "price": Decimal("200.00"), "count": 2},
]

SERVICES = [
    {"name": "Walk", "description": "One walk in the hotel yard",
     "price": Decimal("25.00"), "minutes": 30},
    {"name": "Play session", "description": "Supervised play with a caretaker",
     "price": Decimal("30.00"), "minutes": 30},
    {"name": "Premium meal", "description": "Premium food, one portion per day",
     "price": Decimal("40.00"), "minutes": None},
    {"name": "Grooming", "description": "Bath, brushing and nail trim",
     "price": Decimal("90.00"), "minutes": 60},
    {"name": "Vet check", "description": "Routine check-up with the partner vet",
     "price": Decimal("120.00"), "minutes": 30},
]

PACKAGES = [
    {
        "name": "Basic package",
        "description": "Room, standard food and one walk per day.",
        "price": Decimal("0.00"),
        "includes": [
            {"denumire": "Walk", "cantitate_pe_noapte": 1},
        ],
    },
    {
        "name": "Comfort package",
        "description": "Two walks per day and one supervised play session.",
        "price": Decimal("45.00"),
        "includes": [
            {"denumire": "Walk", "cantitate_pe_noapte": 2},
            {"denumire": "Play session", "cantitate_pe_noapte": 1},
        ],
    },
    {
        "name": "Premium package",
        "description": "Two walks per day, play session, premium meals and a daily report.",
        "price": Decimal("90.00"),
        "includes": [
            {"denumire": "Walk", "cantitate_pe_noapte": 2},
            {"denumire": "Play session", "cantitate_pe_noapte": 1},
            {"denumire": "Premium meal", "cantitate_pe_noapte": 1},
        ],
    },
]


def check_packages():
    known = {service["name"] for service in SERVICES}
    for package in PACKAGES:
        for item in package["includes"]:
            name = item["denumire"]
            if name not in known:
                raise ValueError(
                    f"Package '{package['name']}' lists an unknown service: {name}"
                )


def seed_catalog():
    check_packages()
    with transaction() as cur:
        for room_type in ROOM_TYPES:
            for number in range(1, room_type["count"] + 1):
                cur.execute(
                    "INSERT IGNORE INTO camera (cod, tip_camera, pret_noapte) "
                    "VALUES (?, ?, ?)",
                    (
                        f"{room_type['prefix']}{number:02d}",
                        room_type["type"],
                        room_type["price"],
                    ),
                )

        for service in SERVICES:
            cur.execute(
                "INSERT IGNORE INTO serviciu "
                "(tip, denumire, descriere, pret_curent, durata_minute) "
                "VALUES ('serviciu', ?, ?, ?, ?)",
                (
                    service["name"],
                    service["description"],
                    service["price"],
                    service["minutes"],
                ),
            )

        for package in PACKAGES:
            cur.execute(
                "INSERT IGNORE INTO serviciu "
                "(tip, denumire, descriere, continut, pret_curent, durata_minute) "
                "VALUES ('pachet', ?, ?, ?, ?, NULL)",
                (
                    package["name"],
                    package["description"],
                    json.dumps(package["includes"]),
                    package["price"],
                ),
            )

    rooms = sum(room_type["count"] for room_type in ROOM_TYPES)
    print(
        f"Catalog seeded: {rooms} rooms, "
        f"{len(SERVICES)} services, {len(PACKAGES)} packages."
    )


if __name__ == "__main__":
    seed_catalog()