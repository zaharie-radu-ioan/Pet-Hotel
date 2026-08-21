from datetime import datetime, time, timedelta
from app.rezervari_utils import package_contents

ACTIVITY_TIMES = {
    "Walk": [time(10, 0), time(18, 0)],
    "Play session": [time(15, 0)],
    "Premium meal": [time(12, 0)],
    "Grooming": [time(12, 0)],
    "Vet check": [time(11, 0)],
}

FAMILIARITY_SLACK = 1

class Roster:
    def __init__(self, cur, check_in, check_out, animal_id):
        self.animal_id = animal_id

        cur.execute(
            "SELECT a.id_angajat "
            "FROM angajat a "
            "JOIN utilizator u ON a.id_utilizator = u.id_utilizator "
            "WHERE u.rol = 'angajat' AND u.activ = TRUE "
            "ORDER BY a.id_angajat"
        )

        self.employees = []
        for row in cur.fetchall():
            self.employees.append(row["id_angajat"])

        self.position = {}
        for index, employee in enumerate(self.employees):
            self.position[employee] = index

        self.daily_load = {}    # (employee, date)      -> activities that day
        self.type_load = {}     # (employee, type)      -> of that type
        self.familiarity = {}   # (employee, animal)    -> past activities
        self.busy = set()       # (employee, datetime)  -> slot taken
        self.turn = 0           # rotating tie-break

        if not self.employees:
            return

        self.load_history(cur, animal_id)
        self.load_window(cur, check_in, check_out)

    def load_history(self, cur, animal_id):
        if animal_id is None:
            return

        cur.execute(
            "SELECT a.id_angajat, COUNT(*) AS total "
            "FROM activitate a "
            "JOIN cazare z ON a.id_cazare = z.id_cazare "
            "WHERE z.id_animal = ? "
            "  AND a.id_angajat IS NOT NULL "
            "  AND a.status <> 'anulata' "
            "GROUP BY a.id_angajat",
            (animal_id,),
        )

        for row in cur.fetchall():
            key = (row["id_angajat"], animal_id)
            self.familiarity[key] = row["total"]

    def load_window(self, cur, check_in, check_out):
        cur.execute(
            "SELECT a.id_angajat, a.tip_activitate, a.ora_inceput, "
            "       z.id_animal "
            "FROM activitate a "
            "LEFT JOIN cazare z ON a.id_cazare = z.id_cazare "
            "WHERE a.id_angajat IS NOT NULL "
            "  AND a.status <> 'anulata' "
            "  AND a.ora_inceput >= ? "
            "  AND a.ora_inceput < ?",
            (check_in, check_out),
        )

        for row in cur.fetchall():
            self.book(
                row["id_angajat"],
                row["tip_activitate"],
                row["ora_inceput"],
                row["id_animal"],
            )

    def book(self, employee, name, starts_at, animal_id):
        day = starts_at.date()

        day_key = (employee, day)
        self.daily_load[day_key] = self.daily_load.get(day_key, 0) + 1

        type_key = (employee, name)
        self.type_load[type_key] = self.type_load.get(type_key, 0) + 1

        self.busy.add((employee, starts_at))

        if animal_id is not None:
            animal_key = (employee, animal_id)
            self.familiarity[animal_key] = (
                self.familiarity.get(animal_key, 0) + 1
            )

    def score(self, employee, name, starts_at):
        #How good a fit this employee is. Smaller is better.
        day = starts_at.date()

        return (
            -self.familiarity.get((employee, self.animal_id), 0),
            self.daily_load.get((employee, day), 0),
            self.type_load.get((employee, name), 0),
            (self.position[employee] - self.turn) % len(self.employees),
        )

    def take(self, name, starts_at):
        day = starts_at.date()

        available = []
        for employee in self.employees:
            if (employee, starts_at) not in self.busy:
                available.append(employee)

        if not available:
            return None

        lightest = None
        for employee in available:
            load = self.daily_load.get((employee, day), 0)
            if lightest is None or load < lightest:
                lightest = load

        chosen = None
        best_score = None

        for employee in available:
            load = self.daily_load.get((employee, day), 0)
            if load > lightest + FAMILIARITY_SLACK:
                continue

            current_score = self.score(employee, name, starts_at)

            if best_score is None or current_score < best_score:
                chosen = employee
                best_score = current_score

        self.book(chosen, name, starts_at, self.animal_id)
        self.turn = (self.turn + 1) % len(self.employees)

        return chosen


def stay_animal(cur, stay_id):
    cur.execute(
        "SELECT id_animal FROM cazare WHERE id_cazare = ?",
        (stay_id,),
    )
    row = cur.fetchone()

    if not row:
        return None

    return row["id_animal"]


def insert_activity(cur, stay_id, name, activity_start, roster):
    employee = roster.take(name, activity_start)

    cur.execute(
        "INSERT INTO activitate "
        "(tip_activitate, ora_inceput, id_cazare, id_angajat) "
        "VALUES (?, ?, ?, ?)",
        (
            name,
            activity_start,
            stay_id,
            employee,
        ),
    )


def generate_activities(
    cur,
    stay_id,
    check_in,
    check_out,
    feeding_times,
    package,
):
    animal_id = stay_animal(cur, stay_id)
    roster = Roster(cur, check_in, check_out, animal_id)

    current_date = check_in.date()

    while current_date <= check_out.date():
        # -------------------------
        # 1. Feeding
        # -------------------------
        for feeding_time in feeding_times:
            activity_start = datetime.combine(current_date, feeding_time)

            if check_in <= activity_start < check_out:
                insert_activity(
                    cur,
                    stay_id,
                    "Feeding",
                    activity_start,
                    roster,
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
                    insert_activity(
                        cur,
                        stay_id,
                        name,
                        activity_start,
                        roster,
                    )

        current_date += timedelta(days=1)