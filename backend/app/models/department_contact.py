from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class DepartmentContact(Base):
    """Singleton row holding the department contact info shown in the footer."""

    __tablename__ = "department_contacts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    phone: Mapped[str] = mapped_column(String(64))
    email: Mapped[str] = mapped_column(String(255))
