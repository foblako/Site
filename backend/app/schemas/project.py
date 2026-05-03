from ._base import CamelModel


class ProjectSummary(CamelModel):
    id: str
    title: str
    description: str
    image: str
    tags: list[str]
    status: str
    status_icon: str
    likes: int
    comments: int
    participants: int


class TeamMember(CamelModel):
    name: str
    role: str
    avatar: str
    period: str


class Review(CamelModel):
    author: str
    text: str
    rating: int


class Artifact(CamelModel):
    name: str
    url: str


class ProjectDetail(ProjectSummary):
    full_description: str
    team: list[TeamMember]
    technologies: list[str]
    start_date: str
    community_rating: float
    experts_rating: float
    screenshots: int
    reviews: list[Review]
    artifacts: list[Artifact]
