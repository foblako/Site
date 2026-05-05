import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


def _new_uuid() -> str:
    return str(uuid.uuid4())


def _now_utc() -> datetime:
    return datetime.now(UTC)


class VacancyApplication(Base):
    """A single user's response to a vacancy.

    One row per (vacancy, user) — enforced by a UNIQUE constraint. Removing
    the row (via DELETE /apply) lets the user re-apply with a different
    message; this keeps the data model simple and matches the UX of a
    toggle-style apply button.
    """

    __tablename__ = "vacancy_applications"
    __table_args__ = (
        UniqueConstraint("vacancy_id", "user_id", name="uq_vacancy_applications_vacancy_user"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_uuid)
    vacancy_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("vacancies.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    message: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now_utc)
