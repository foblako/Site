from datetime import datetime

from pydantic import Field

from ._base import CamelModel


class CommentAuthor(CamelModel):
    id: str
    display_name: str


class Comment(CamelModel):
    id: str
    body: str
    created_at: datetime
    author: CommentAuthor


class CommentCreate(CamelModel):
    body: str = Field(min_length=1, max_length=2000)
