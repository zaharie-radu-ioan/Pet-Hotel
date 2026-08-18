import json
from datetime import datetime, time

CHECK_IN_TIME = time(14, 0)
CHECK_OUT_TIME = time(11, 0)
INVOICE_PREFIX = "F"

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