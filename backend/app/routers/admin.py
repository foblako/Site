"""CRUD endpoints for admins. Gated behind `require_admin`.

All write endpoints live under `/api/admin/*` so the prefix makes the
permission requirement obvious to anyone skimming the URL. Public read
endpoints stay where they were; nothing here shadows them.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..deps import require_admin
from ..models import (
    Direction,
    HallOfFameStar,
    Project,
    User,
    Vacancy,
    VacancyApplication,
)
from ..schemas.admin import (
    AdminApplicationApplicant,
    AdminDirectionIn,
    AdminDirectionPatch,
    AdminProjectIn,
    AdminProjectPatch,
    AdminStarIn,
    AdminStarPatch,
    AdminVacancyApplication,
    AdminVacancyIn,
    AdminVacancyPatch,
)
from ..schemas.direction import Direction as DirectionOut
from ..schemas.hall_of_fame import HallOfFameStar as StarOut
from ..schemas.project import ProjectDetail
from ..schemas.vacancy import Vacancy as VacancyOut

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_admin)],
)


# --------------------------------------------------------------------------- #
# Projects
# --------------------------------------------------------------------------- #


@router.post("/projects", response_model=ProjectDetail, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: AdminProjectIn, session: AsyncSession = Depends(get_session)
) -> Project:
    existing = await session.get(Project, payload.id)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Project with id {payload.id!r} already exists",
        )
    project = Project(**payload.model_dump())
    session.add(project)
    await session.commit()
    await session.refresh(project)
    return project


@router.patch("/projects/{project_id}", response_model=ProjectDetail)
async def update_project(
    project_id: str,
    payload: AdminProjectPatch,
    session: AsyncSession = Depends(get_session),
) -> Project:
    project = await session.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    await session.commit()
    await session.refresh(project)
    return project


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: str, session: AsyncSession = Depends(get_session)) -> None:
    project = await session.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    await session.delete(project)
    await session.commit()


# --------------------------------------------------------------------------- #
# Vacancies
# --------------------------------------------------------------------------- #


@router.post("/vacancies", response_model=VacancyOut, status_code=status.HTTP_201_CREATED)
async def create_vacancy(
    payload: AdminVacancyIn, session: AsyncSession = Depends(get_session)
) -> Vacancy:
    vacancy = Vacancy(**payload.model_dump())
    session.add(vacancy)
    await session.commit()
    await session.refresh(vacancy)
    return vacancy


@router.patch("/vacancies/{vacancy_id}", response_model=VacancyOut)
async def update_vacancy(
    vacancy_id: int,
    payload: AdminVacancyPatch,
    session: AsyncSession = Depends(get_session),
) -> Vacancy:
    vacancy = await session.get(Vacancy, vacancy_id)
    if vacancy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vacancy not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(vacancy, field, value)
    await session.commit()
    await session.refresh(vacancy)
    return vacancy


@router.delete("/vacancies/{vacancy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vacancy(vacancy_id: int, session: AsyncSession = Depends(get_session)) -> None:
    vacancy = await session.get(Vacancy, vacancy_id)
    if vacancy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vacancy not found")
    await session.delete(vacancy)
    await session.commit()


@router.get(
    "/vacancies/{vacancy_id}/applications",
    response_model=list[AdminVacancyApplication],
)
async def list_vacancy_applications(
    vacancy_id: int, session: AsyncSession = Depends(get_session)
) -> list[AdminVacancyApplication]:
    vacancy = await session.get(Vacancy, vacancy_id)
    if vacancy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vacancy not found")
    result = await session.execute(
        select(VacancyApplication, User)
        .join(User, User.id == VacancyApplication.user_id)
        .where(VacancyApplication.vacancy_id == vacancy_id)
        .order_by(VacancyApplication.created_at.desc())
    )
    return [
        AdminVacancyApplication(
            id=application.id,
            vacancy_id=application.vacancy_id,
            message=application.message,
            created_at=application.created_at,
            applicant=AdminApplicationApplicant(
                id=user.id,
                email=user.email,
                display_name=user.display_name,
                avatar_url=user.avatar_url,
            ),
        )
        for application, user in result.all()
    ]


# --------------------------------------------------------------------------- #
# Directions
# --------------------------------------------------------------------------- #


@router.post("/directions", response_model=DirectionOut, status_code=status.HTTP_201_CREATED)
async def create_direction(
    payload: AdminDirectionIn, session: AsyncSession = Depends(get_session)
) -> Direction:
    direction = Direction(**payload.model_dump())
    session.add(direction)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Direction with this name already exists",
        ) from None
    await session.refresh(direction)
    return direction


@router.patch("/directions/{direction_id}", response_model=DirectionOut)
async def update_direction(
    direction_id: int,
    payload: AdminDirectionPatch,
    session: AsyncSession = Depends(get_session),
) -> Direction:
    direction = await session.get(Direction, direction_id)
    if direction is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Direction not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(direction, field, value)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Direction with this name already exists",
        ) from None
    await session.refresh(direction)
    return direction


@router.delete("/directions/{direction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_direction(direction_id: int, session: AsyncSession = Depends(get_session)) -> None:
    direction = await session.get(Direction, direction_id)
    if direction is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Direction not found")
    await session.delete(direction)
    await session.commit()


# --------------------------------------------------------------------------- #
# Hall of fame
# --------------------------------------------------------------------------- #


@router.post("/stars", response_model=StarOut, status_code=status.HTTP_201_CREATED)
async def create_star(
    payload: AdminStarIn, session: AsyncSession = Depends(get_session)
) -> HallOfFameStar:
    star = HallOfFameStar(**payload.model_dump())
    session.add(star)
    await session.commit()
    await session.refresh(star)
    return star


@router.patch("/stars/{star_id}", response_model=StarOut)
async def update_star(
    star_id: int,
    payload: AdminStarPatch,
    session: AsyncSession = Depends(get_session),
) -> HallOfFameStar:
    star = await session.get(HallOfFameStar, star_id)
    if star is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Star not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(star, field, value)
    await session.commit()
    await session.refresh(star)
    return star


@router.delete("/stars/{star_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_star(star_id: int, session: AsyncSession = Depends(get_session)) -> None:
    star = await session.get(HallOfFameStar, star_id)
    if star is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Star not found")
    await session.delete(star)
    await session.commit()
