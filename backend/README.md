# Vega Site API

FastAPI backend for the Vega MIREA department site (foblako/Site).

**PR 1** shipped the runnable skeleton, the database schema, the public
read-only `GET` endpoints, and a seeder that mirrors the data the React
frontend currently bundles in `src/data/*.ts`. **PR 2 (this change)** adds
email/password authentication: `User` model + migration, bcrypt password
hashing, JWT access/refresh tokens, and `/api/auth/{register,login,refresh,me}`.
Mutations (likes, comments, applications) and admin CRUD will land in
subsequent PRs.

## Quick start (Docker, recommended)

```bash
cd backend
docker compose up --build
```

This starts a Postgres container, applies migrations, seeds the database, and
serves the API on <http://localhost:8000>. Swagger UI: <http://localhost:8000/docs>.

## Quick start (local Python, no Docker)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"   # or: uv sync --all-extras
cp .env.example .env       # defaults to a SQLite file at ./dev.db
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload
```

## Endpoints

| Method | Path                        | Auth      | Notes                                              |
| ------ | --------------------------- | --------- | -------------------------------------------------- |
| GET    | `/api/health`               | —         | Liveness probe                                     |
| POST   | `/api/auth/register`        | —         | Create a new user (email + password)               |
| POST   | `/api/auth/login`           | —         | Returns `{accessToken, refreshToken}`              |
| POST   | `/api/auth/refresh`         | refresh   | Trade refresh token for a fresh pair               |
| GET    | `/api/auth/me`              | access    | Current user                                       |
| GET    | `/api/projects`             | —         | Project summaries (matches `ProjectSummary[]`)     |
| GET    | `/api/projects/{id}`        | —         | Project detail (matches `ProjectDetail`)           |
| GET    | `/api/vacancies`            | —         | Vacancy list                                       |
| GET    | `/api/vacancies/{id}`       | —         | Single vacancy                                     |
| GET    | `/api/directions`           | —         | Department directions                              |
| GET    | `/api/hall-of-fame`         | —         | Hall-of-fame stars                                 |
| GET    | `/api/contacts/department`  | —         | Department phone/email                             |
| GET    | `/api/portfolio/default`    | —         | The seeded `DEFAULT_USER` portfolio                |

Authenticated endpoints expect `Authorization: Bearer <accessToken>`. Tokens
are signed with `JWT_SECRET` from `.env` (regenerate for production).

JSON keys are `camelCase` so they match the existing TypeScript types in
`src/types/index.ts` without any frontend changes.

## Re-exporting seed data from the frontend

When `src/data/*.ts` changes, regenerate the JSON snapshots used by the seeder:

```bash
npx tsx backend/scripts/export-seed.mjs
```

## Tests

```bash
pip install -e ".[dev]"
pytest
```

Tests use an in-memory SQLite database that is created and seeded fresh per
test, so they run hermetically and require no external services.

## Project layout

```
backend/
├── app/
│   ├── main.py            # FastAPI app + CORS + router wiring
│   ├── config.py          # pydantic-settings (.env)
│   ├── db.py              # async engine + session factory + DI
│   ├── models/            # SQLAlchemy ORM models
│   ├── schemas/           # Pydantic response models (camelCase)
│   ├── routers/           # HTTP layer
│   └── seed.py            # idempotent seeder (loads seed_data/*.json)
├── alembic/               # migrations (Alembic, async)
├── seed_data/             # JSON snapshots of src/data/*.ts
├── scripts/export-seed.mjs# regenerator for seed_data/
├── tests/                 # pytest + httpx
├── Dockerfile
├── docker-compose.yml     # api + Postgres for local dev
└── pyproject.toml
```
