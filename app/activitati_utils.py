from datetime import datetime, time, timedelta
from app.rezervari_utils import package_contents

ACTIVITY_TIMES = {
    "Walk": [time(10, 0), time(18, 0)],
    "Play session": [time(15, 0)],
    "Premium meal": [time(12, 0)],
    "Grooming": [time(12, 0)],
    "Vet check": [time(11, 0)],
}
def generate_activities(
    cur,
    stay_id,
    check_in,
    check_out,
    feeding_times,
    package,
):
    current_date = check_in.date()

    while current_date <= check_out.date():
        # -------------------------
        # 1. Feeding
        # -------------------------
        for feeding_time in feeding_times:
            activity_start = datetime.combine(current_date, feeding_time)

            if check_in <= activity_start < check_out:
                cur.execute(
                    "INSERT INTO activitate "
                    "(tip_activitate, ora_inceput, id_cazare) "
                    "VALUES (?, ?, ?)",
                    (
                        "hranire",
                        activity_start,
                        stay_id,
                    ),
                )

        # -------------------------
        # 2. Package activities
        # -------------------------
        for item in package_contents(package["continut"]):
            name = item.get("denumire")
            quantity = int(item.get("cantitate_pe_noapte", 1))

            if not name:
                continue

            times = ACTIVITY_TIMES.get(name, [])

            for occurrence in range(quantity):
                if occurrence >= len(times):
                    break

                activity_start = datetime.combine(
                    current_date,
                    times[occurrence],
                )

                if check_in <= activity_start < check_out:
                    cur.execute(
                        "INSERT INTO activitate "
                        "(tip_activitate, ora_inceput, id_cazare) "
                        "VALUES (?, ?, ?)",
                        (
                            name,
                            activity_start,
                            stay_id,
                        ),
                    )

        current_date += timedelta(days=1)