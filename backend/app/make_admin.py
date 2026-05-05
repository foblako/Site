"""CLI helper: promote an existing user to `role='admin'` by email.

Usage:

    python -m app.make_admin user@example.com

Run this on the backend host (the same env that serves `uvicorn app.main:app`)
so it picks up the same `DATABASE_URL`.
"""

from __future__ import annotations

import asyncio
import sys

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from .config import settings
from .models.user import User


async def _promote(email: str) -> None:
    engine = create_async_engine(settings.database_url)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user is None:
            print(f"No user with email {email!r}", file=sys.stderr)
            sys.exit(1)
        if user.role == "admin":
            print(f"{email} is already an admin.")
            return
        user.role = "admin"
        await session.commit()
        print(f"Promoted {email} to admin.")
    await engine.dispose()


def main() -> None:
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <email>", file=sys.stderr)
        sys.exit(2)
    asyncio.run(_promote(sys.argv[1]))


if __name__ == "__main__":
    main()
