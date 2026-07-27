from scripts.setup_db import create_tables

def init_db():
    print("Se creeaza structura bazei de date ...")
    create_tables()
    print("Schema.sql aplicata.")

if __name__ == "__main__":
    init_db()
