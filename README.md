# Pet-Hotel

Booking and operations system for a pet boarding facility. Clients book rooms and care packages for their animals, employees work off a generated task list, and the manager sees occupancy and revenue in one dashboard.

Built with FastAPI, MariaDB (raw SQL, no ORM) and React.

---

## Getting started

### Prerequisites

- Python 3.11+
- Node.js 20+
- Docker and Docker Compose
- MariaDB Connector/C (required by the `mariadb` Python package)

### 1. Clone and create a virtual environment

```bash
git clone https://github.com/zaharie-radu-ioan/Pet-Hotel.git
cd Pet-Hotel

python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate

pip install -r requirements.txt
```

### 2. Create the `.env` file

Create a `.env` in the project root. See [Configuration](#configuration) for the full list.

```env
DB_HOST=127.0.0.1
DB_PORT=3307
DB_NAME=pethotel
DB_USER=root
DB_PASSWORD=change-me
DB_CONNECT_TIMEOUT=10
DB_POOL_SIZE=5

JWT_SECRET=generate-a-long-random-value
ACCESS_TOKEN_MINUTES=15
REFRESH_TOKEN_DAYS=7
COOKIE_SECURE=false
FRONTEND_ORIGIN=http://localhost:5173
```

Generate a secret with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

### 3. Start the database and the API

```bash
./start.sh
```

The script brings up the MariaDB container and starts Uvicorn with hot reload. To do it manually:

```bash
docker-compose up -d
uvicorn app.main:app --reload
```

### 4. Create the schema and seed the catalog

With the container running:

```bash
python -m scripts.init_db
python -m scripts.setup_db
```

This applies `sql/schema.sql` and populates 12 rooms across three types plus the service and package catalog.

### 5. Start the frontend

```bash
cd pet-hotel-react
npm install
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| Health check | http://localhost:8000/ |

---

## Configuration

All configuration is read from environment variables. Nothing is hard-coded and `.env` is gitignored.

| Variable | Required | Default | Description |
|---|:---:|---|---|
| `DB_HOST` | | — | Database host |
| `DB_PORT` | ✓ | — | Host port mapped to the container |
| `DB_NAME` | ✓ | — | Database name |
| `DB_USER` | ✓ | — | Database user |
| `DB_PASSWORD` | ✓ | — | Database password |
| `DB_CONNECT_TIMEOUT` | | — | Connection timeout in seconds |
| `DB_POOL_SIZE` | | — | Connection pool size |
| `JWT_SECRET` | ✓ | — | Signing key; the app refuses to start without it |
| `ACCESS_TOKEN_MINUTES` | | `15` | Access token lifetime |
| `REFRESH_TOKEN_DAYS` | | `7` | Refresh token lifetime |
| `COOKIE_SECURE` | | `false` | Set to `true` behind HTTPS |
| `FRONTEND_ORIGIN` | | `http://localhost:5173` | Allowed CORS origin |

CORS is restricted to a single explicit origin because credentials are sent with requests: a wildcard is not valid in that mode.

---
