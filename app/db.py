import os
from contextlib import contextmanager
from dotenv import load_dotenv
import mariadb

load_dotenv()


def config():
    required = ("DB_USER", "DB_PASSWORD", "DB_PORT", "DB_NAME")
    for key in required:
        if not os.getenv(key):
            raise RuntimeError(f"Missing required environment variable: {key}")

    return {
        "host": os.getenv("DB_HOST"),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD"),
        "database": os.getenv("DB_NAME"),
        "port": int(os.getenv("DB_PORT")),
        "connect_timeout": int(os.getenv("DB_CONNECT_TIMEOUT")),
        "autocommit": False,
    }

def get_connection():
    return mariadb.connect(**config())

pool = None

def get_pool():
    global pool
    if pool is None:
        pool = mariadb.ConnectionPool(
            pool_name="pethotel",
            pool_size=int(os.getenv("DB_POOL_SIZE")),
            pool_reset_connection=True,
            **config()
        )
    return pool

@contextmanager
def cursor(dictionary=False, commit=False):
    conn = get_pool().get_connection()
    cur = conn.cursor(dictionary=dictionary)
    try:
        yield cur
        if commit:
            conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()

@contextmanager
def transaction(dictionary=False):
    with cursor(dictionary=dictionary, commit=True) as c:
        yield c

def run_select(sql, params=(), dictionary=False):
    with cursor(dictionary=dictionary) as c:
        c.execute(sql, params)
        return c.fetchall()

def run_select_one(sql, params=(), dictionary=False):
    with cursor(dictionary=dictionary) as c:
        c.execute(sql, params)
        return c.fetchone()

def run_execute(sql, params=()):
    with cursor(commit=True) as c:
        c.execute(sql, params)
        return c.rowcount

def run_insert(sql, params=()):
    with cursor(commit=True) as c:
        c.execute(sql, params)
        return c.lastrowid
