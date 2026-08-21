from app.db import run_select, run_select_one, run_execute

HISTORY_DAYS = 30

MAX_NOTIFICATIONS = 50

MESSAGES = {
    "Feeding": "{animal} was fed",
    "Walk": "{animal} went for a walk",
    "Play session": "{animal} had a play session",
    "Premium meal": "{animal} had a premium meal",
    "Grooming": "{animal} was groomed",
    "Vet check": "{animal} had a vet check",
}


def message_for(activity_type, animal):
    template = MESSAGES.get(activity_type)

    if template:
        return template.format(animal=animal)

    return f"{animal}: {activity_type} completed"


def load_notifications(client_id, seen_at):
    rows = run_select(
        "SELECT a.id_activitate, "
        "       a.tip_activitate, "
        "       COALESCE(a.finalizat_la, a.ora_inceput) AS moment, "
        "       z.nume_animal, "
        "       z.id_animal "
        "FROM activitate a "
        "JOIN cazare z ON a.id_cazare = z.id_cazare "
        "JOIN rezervare r ON z.id_rezervare = r.id_rezervare "
        "WHERE r.id_client = ? "
        "  AND a.status = 'finalizata' "
        "  AND COALESCE(a.finalizat_la, a.ora_inceput) "
        "      >= NOW() - INTERVAL ? DAY "
        "ORDER BY moment DESC "
        f"LIMIT {int(MAX_NOTIFICATIONS)}",
        (client_id, HISTORY_DAYS),
        dictionary=True,
    )

    notifications = []

    for row in rows:
        moment = row["moment"]

        notifications.append(
            {
                "id_activitate": row["id_activitate"],
                "tip_activitate": row["tip_activitate"],
                "animal": row["nume_animal"],
                "id_animal": row["id_animal"],
                "mesaj": message_for(row["tip_activitate"], row["nume_animal"]),
                "moment": moment,
                "citit": seen_at is not None and moment <= seen_at,
            }
        )

    return notifications


def count_unread(client_id, seen_at):
    if seen_at is None:
        params = (client_id, HISTORY_DAYS)
        condition = ""
    else:
        params = (client_id, HISTORY_DAYS, seen_at)
        condition = "  AND COALESCE(a.finalizat_la, a.ora_inceput) > ? "

    row = run_select_one(
        "SELECT COUNT(*) AS total "
        "FROM activitate a "
        "JOIN cazare z ON a.id_cazare = z.id_cazare "
        "JOIN rezervare r ON z.id_rezervare = r.id_rezervare "
        "WHERE r.id_client = ? "
        "  AND a.status = 'finalizata' "
        "  AND COALESCE(a.finalizat_la, a.ora_inceput) "
        "      >= NOW() - INTERVAL ? DAY "
        + condition,
        params,
        dictionary=True,
    )

    return row["total"] if row else 0


def get_seen_at(user_id):
    row = run_select_one(
        "SELECT ultima_notificare_vazuta FROM utilizator WHERE id_utilizator = ?",
        (user_id,),
        dictionary=True,
    )

    return row["ultima_notificare_vazuta"] if row else None


def mark_seen(user_id):
    run_execute(
        "UPDATE utilizator SET ultima_notificare_vazuta = NOW() "
        "WHERE id_utilizator = ?",
        (user_id,),
    )