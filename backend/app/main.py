from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import (
    auth,
    contacts,
    directions,
    hall_of_fame,
    portfolio,
    project_comments,
    projects,
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
):
    app.include_router(router, prefix="/api")
