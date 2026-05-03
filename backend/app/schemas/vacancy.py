from ._base import CamelModel


class Vacancy(CamelModel):
    id: int
    title: str
    description: str
    tags: list[str]
    responsibilities: str
    responsibilities_list: list[str]
