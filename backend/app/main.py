from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .routers import (
    admin,
    auth,
    contacts,
    directions,
    hall_of_fame,
    portfolio,
    project_comments,
    projects,
    uploads,
    vacancies,
)

app = FastAPI(
    title="Vega Site API",
    version="0.1.0",
    description="Backend for the Vega MIREA department site (foblako/Site).",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", tags=["meta"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


for router in (
    auth.router,
    projects.router,
    project_comments.router,
    vacancies.router,
    directions.router,
    hall_of_fame.router,
    contacts.router,
    portfolio.router,
    uploads.router,
    admin.router,
):
    app.include_router(router, prefix="/api")


# User-uploaded content (avatars, project screenshots) lives on disk and is
# served as static files. The mount is created after the uploads dir exists
# so StaticFiles' own sanity check passes even on a fresh clone.
_uploads_path = Path(settings.uploads_dir).resolve()
_uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=_uploads_path), name="uploads")
