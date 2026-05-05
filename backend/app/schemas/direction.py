from ._base import CamelModel


class Direction(CamelModel):
    id: int
    name: str
    technologies: list[str]
