from ._base import CamelModel


class HallOfFameStar(CamelModel):
    id: int
    name: str
    role: str
    avatar: str
