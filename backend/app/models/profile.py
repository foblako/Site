from typing import Any

from sqlalchemy import JSON, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class Profile(Base):
    """Portfolio-page user profile.

    PR 1 ships a single "default" profile that mirrors `DEFAULT_USER` from
    `src/data/portfolio.ts`. Real per-user profiles will be linked to user
    accounts once authentication lands.
    """

    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(64), unique=True, default="default")
    name: Mapped[str] = mapped_column(String(255))

    info: Mapped[list[dict[str, str]]] = mapped_column(JSON, default=list)
    about: Mapped[list[str]] = mapped_column(JSON, default=list)
    skills: Mapped[list[str]] = mapped_column(JSON, default=list)
    goals: Mapped[list[str]] = mapped_column(JSON, default=list)
    works: Mapped[list[dict[str, str]]] = mapped_column(JSON, default=list)
    contacts: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)

    raw: Mapped[str | None] = mapped_column(Text, nullable=True)
