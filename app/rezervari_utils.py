import json
from datetime import datetime, time, timedelta

CHECK_IN_TIME = time(14, 0)
CHECK_OUT_TIME = time(11, 0)
INVOICE_PREFIX = "F"

# Ore implicite pentru serviciile din pachete. Hrănirea nu e aici — ea
# folosește mereu orele alese de client, nu valori fixe.
DEFAULT_ACTIVITY_TIMES = {
    "Walk": [time(9, 0), time(17, 0)],
    "Play session": [time(16, 0)],
    "Premium meal": [time(19, 0)],
    "Grooming": [time(11, 0)],
    "Vet check": [time(10, 0)],
}


def stay_range(start_date, end_date):
    return (
        datetime.combine(start_date, CHECK_IN_TIME),
        datetime.combine(end_date, CHECK_OUT_TIME),
    )


def count_nights(start_date, end_date):
    return (end_date - start_date).days


def invoice_number(reservation_id, issued_at):
    return f"{INVOICE_PREFIX}-{issued_at.year}-{reservation_id:06d}"


def package_contents(raw):
    if not raw:
        return []
    try:
        items = json.loads(raw)
    except (TypeError, ValueError):
        return []
    if not isinstance(items, list):
        return []
    return items


def activity_time_for(service_name, occurrence_index):
    times = DEFAULT_ACTIVITY_TIMES.get(service_name, [time(12, 0)])
    return times[occurrence_index % len(times)]


def stay_days(start_date, end_date):
    days = []
    current = start_date
    while current < end_date:
        days.append(current)
        current += timedelta(days=1)
    return days


def timedelta_to_time(value):
    if isinstance(value, time):
        return value
    total_seconds = int(value.total_seconds())
    hours, remainder = divmod(total_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    return time(hours, minutes, seconds)