"""Idempotent seeder that loads `backend/seed_data/*.json` (re-exported from
`src/data/*.ts` via `npx tsx backend/scripts/export-seed.mjs`) into the database.

Usage:
    python -m app.seed                   # uses DATABASE_URL from environment / .env
"""

from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Any

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from .db import SessionLocal, engine
from .models import (
    Base,
    DepartmentContact,
    Direction,
    HallOfFameStar,
    Profile,
    Project,
    Vacancy,
)

SEED_DIR = Path(__file__).resolve().parent.parent / "seed_data"


def _load(name: str) -> Any:
    with (SEED_DIR / name).open(encoding="utf-8") as f:
        return json.load(f)


async def seed(session: AsyncSession) -> None:
    # Wipe & reload — keeps the seeder safe to run repeatedly during dev.
    for model in (Project, Vacancy, Direction, HallOfFameStar, DepartmentContact, Profile):
        await session.execute(delete(model))

    projects = _load("projects.json")
    summaries: list[dict[str, Any]] = projects["summaries"]
    details: dict[str, dict[str, Any]] = projects["details"]
    for summary in summaries:
        detail = details.get(summary["id"], {})
        session.add(
            Project(
                id=summary["id"],
                title=summary["title"],
                description=summary["description"],
                image=summary["image"],
                status=summary["status"],
                status_icon=summary["statusIcon"],
                likes=summary["likes"],
                comments=summary["comments"],
                participants=summary["participants"],
                tags=summary.get("tags", []),
                full_description=detail.get("fullDescription"),
                start_date=detail.get("startDate"),
                community_rating=detail.get("communityRating"),
                experts_rating=detail.get("expertsRating"),
                screenshots=detail.get("screenshots", 0),
                technologies=detail.get("technologies", []),
                team=detail.get("team", []),
                reviews=detail.get("reviews", []),
                artifacts=detail.get("artifacts", []),
            )
        )

    for vacancy in _load("vacancies.json"):
        session.add(
            Vacancy(
                id=vacancy["id"],
                title=vacancy["title"],
                description=vacancy["description"],
                tags=vacancy.get("tags", []),
                responsibilities=vacancy.get("responsibilities", ""),
                responsibilities_list=vacancy.get("responsibilitiesList", []),
            )
        )

    for direction in _load("directions.json"):
        session.add(
            Direction(name=direction["name"], technologies=direction.get("technologies", []))
        )

    for star in _load("hall_of_fame.json"):
        session.add(
            HallOfFameStar(
                id=star["id"], name=star["name"], role=star["role"], avatar=star["avatar"]
            )
        )

    contacts = _load("contacts.json")
    session.add(DepartmentContact(id=1, phone=contacts["phone"], email=contacts["email"]))

    portfolio = _load("portfolio.json")
    session.add(
        Profile(
            slug="default",
            name=portfolio["name"],
            info=portfolio.get("info", []),
            about=portfolio.get("about", []),
            skills=portfolio.get("skills", []),
            goals=portfolio.get("goals", []),
            works=portfolio.get("works", []),
            contacts=portfolio.get("contacts", {}),
        )
    )

    await session.commit()


async def main() -> None:
    async with engine.begin() as conn:
        # Convenience: ensure tables exist when seeding into a fresh SQLite DB
        # without first running Alembic. Safe no-op if the schema is already up
        # to date.
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as session:
        await seed(session)


if __name__ == "__main__":
    asyncio.run(main())
