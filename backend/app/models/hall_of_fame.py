from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class HallOfFameStar(Base):
    __tablename__ = "hall_of_fame_stars"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(128))
    avatar: Mapped[str] = mapped_column(String(512))
