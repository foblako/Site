from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


def _now_utc() -> datetime:
    return datetime.now(UTC)


class ProjectLike(Base):
    """A single user's like on a project.

    The `projects.likes` counter stays denormalized for fast list queries —
    we keep it in sync by +/- 1 on each toggle. If it ever drifts from the
    real row count a simple `SELECT COUNT(*) ... GROUP BY project_id` job
    can rebuild it.
    """

    __tablename__ = "project_likes"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    project_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now_utc)
