"""Schemas used exclusively by `/api/admin/*` endpoints.

Project / Vacancy CRUD inputs mirror the full model fields so admins can
edit everything the frontend reads. Keeping them separate from the public
read schemas lets us evolve the public contract (adding computed fields
like `likedByMe`) without turning them into required inputs here.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import Field

from ._base import CamelModel


class AdminProjectIn(CamelModel):
    id: str = Field(min_length=1, max_length=64)
    title: str = Field(min_length=1, max_length=255)
    description: str
    image: str
    status: str = Field(min_length=1, max_length=64)
    status_icon: str
    participants: int = 0
    tags: list[str] = []
    full_description: str | None = None
    start_date: str | None = None
    community_rating: float | None = None
    experts_rating: float | None = None
    screenshots: int = 0
    technologies: list[str] = []
    team: list[dict[str, Any]] = []
    reviews: list[dict[str, Any]] = []
    artifacts: list[dict[str, Any]] = []


class AdminProjectPatch(CamelModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    image: str | None = None
    status: str | None = Field(default=None, min_length=1, max_length=64)
    status_icon: str | None = None
    participants: int | None = None
    tags: list[str] | None = None
    full_description: str | None = None
    start_date: str | None = None
    community_rating: float | None = None
    experts_rating: float | None = None
    screenshots: int | None = None
    technologies: list[str] | None = None
    team: list[dict[str, Any]] | None = None
    reviews: list[dict[str, Any]] | None = None
    artifacts: list[dict[str, Any]] | None = None


class AdminVacancyIn(CamelModel):
    title: str = Field(min_length=1, max_length=255)
    description: str
    tags: list[str] = []
    responsibilities: str = ""
    responsibilities_list: list[str] = []


class AdminVacancyPatch(CamelModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    tags: list[str] | None = None
    responsibilities: str | None = None
    responsibilities_list: list[str] | None = None


class AdminDirectionIn(CamelModel):
    name: str = Field(min_length=1, max_length=128)
    technologies: list[str] = []


class AdminDirectionPatch(CamelModel):
    name: str | None = Field(default=None, min_length=1, max_length=128)
    technologies: list[str] | None = None


class AdminStarIn(CamelModel):
    name: str = Field(min_length=1, max_length=255)
    role: str = Field(min_length=1, max_length=128)
    avatar: str


class AdminStarPatch(CamelModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    role: str | None = Field(default=None, min_length=1, max_length=128)
    avatar: str | None = None


class AdminApplicationApplicant(CamelModel):
    id: str
    email: str
    display_name: str
    avatar_url: str | None = None


class AdminVacancyApplication(CamelModel):
    id: str
    vacancy_id: int
    message: str
    created_at: datetime
    applicant: AdminApplicationApplicant
