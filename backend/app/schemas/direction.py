from ._base import CamelModel


class Direction(CamelModel):
    name: str
    technologies: list[str]
