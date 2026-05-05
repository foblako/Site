from typing import Any

from sqlalchemy import JSON, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class UserProfile(Base):
    """Per-user portfolio profile.

    Separate from the `profiles` table, which keeps the read-only "default"
    template shown to anonymous visitors. A row is created lazily on the
    first `GET /api/portfolio/me` hit, seeded from the default template with
    the user's `display_name` as the initial `name`.
    """

    __tablename__ = "user_profiles"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    name: Mapped[str] = mapped_column(String(255))

    info: Mapped[list[dict[str, str]]] = mapped_column(JSON, default=list)
    about: Mapped[list[str]] = mapped_column(JSON, default=list)
    skills: Mapped[list[str]] = mapped_column(JSON, default=list)
    goals: Mapped[list[str]] = mapped_column(JSON, default=list)
    works: Mapped[list[dict[str, str]]] = mapped_column(JSON, default=list)
    contacts: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
