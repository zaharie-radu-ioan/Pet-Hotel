from pathlib import Path
from app.db import get_connection

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SQL_DIR = PROJECT_ROOT / "sql"


def has_code(text):
    for line in text.splitlines():
        line = line.strip()
        if line and not line.startswith("--"):
            return True
    return False

def first_code_line(text):
    for line in text.splitlines():
        line = line.strip()
        if line and not line.startswith("--"):
            return line
    return text[:80]


def apply_file(filename, delimiter=";"):
    path = SQL_DIR / filename
    if not path.exists():
        print(f"INFO: Fisierul {filename} nu exista.")
        return

    sql_text = path.read_text(encoding="utf-8")
    statements = [s.strip() for s in sql_text.split(delimiter) if has_code(s)]

    if not statements:
        return

    conn = get_connection()
    cur = conn.cursor()
    try:
        for index, statement in enumerate(statements, start=1):
            try:
                cur.execute(statement)
            except Exception as error:
                mesaj = (
                    f"Eroare la rularea '{filename}' (blocul {index} din {len(statements)}).\n"
                    f"Comanda care a esuat: {first_code_line(statement)}\n"
                    f"Motivul: {error}"
                )
                raise RuntimeError(mesaj) from error

        conn.commit()
        return len(statements)
    finally:
        cur.close()
        conn.close()


def create_tables():
    apply_file("schema.sql", delimiter=";")

if __name__ == "__main__":
    create_tables()
