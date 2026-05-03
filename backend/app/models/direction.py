from sqlalchemy import JSON, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class Direction(Base):
    __tablename__ = "directions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(128), unique=True)
    technologies: Mapped[list[str]] = mapped_column(JSON, default=list)
