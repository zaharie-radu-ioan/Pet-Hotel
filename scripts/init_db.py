from scripts.seed_catalog import seed_catalog
from scripts.setup_db import create_tables

def init_db():
    print("Creating the database structure ...")
    create_tables()
    print("schema.sql applied.")
    seed_catalog()


if __name__ == "__main__":
    init_db()