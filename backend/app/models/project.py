from typing import Any

from sqlalchemy import JSON, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class Project(Base):
    """A community/department project shown on the home page and `/projects`.

    Counters (`likes`, `comments`, `participants`) are denormalized for now to
    match the existing frontend payload. They will be derived from join tables
    once the like/comment endpoints land in a follow-up PR.
    """

    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    image: Mapped[str] = mapped_column(String(512))
    status: Mapped[str] = mapped_column(String(64))
    status_icon: Mapped[str] = mapped_column(String(512))

    likes: Mapped[int] = mapped_column(Integer, default=0)
    comments: Mapped[int] = mapped_column(Integer, default=0)
    participants: Mapped[int] = mapped_column(Integer, default=0)

    tags: Mapped[list[str]] = mapped_column(JSON, default=list)

    full_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[str | None] = mapped_column(String(32), nullable=True)
    community_rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    experts_rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    screenshots: Mapped[int] = mapped_column(Integer, default=0)

    technologies: Mapped[list[str]] = mapped_column(JSON, default=list)
    team: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    reviews: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    artifacts: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)

    @property
    def has_detail(self) -> bool:
        return self.full_description is not None
