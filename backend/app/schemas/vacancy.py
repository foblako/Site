from datetime import datetime

from pydantic import Field

from ._base import CamelModel


class Vacancy(CamelModel):
    id: int
    title: str
    description: str
    tags: list[str]
    responsibilities: str
    responsibilities_list: list[str]
    # `None` for anonymous visitors; `True`/`False` for authenticated ones.
    applied_by_me: bool | None = None


class VacancyApplicationCreate(CamelModel):
    message: str = Field(min_length=1, max_length=4000)


class VacancyApplication(CamelModel):
    id: str
    vacancy_id: int
    message: str
    created_at: datetime
