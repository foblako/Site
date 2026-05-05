from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..deps import get_current_user, get_optional_user
from ..models import User
from ..models import Vacancy as VacancyModel
from ..models import VacancyApplication as VacancyApplicationModel
from ..schemas.vacancy import (
    Vacancy,
    VacancyApplication,
    VacancyApplicationCreate,
)

router = APIRouter(prefix="/vacancies", tags=["vacancies"])


async def _applied_vacancy_ids(session: AsyncSession, user: User | None) -> set[int]:
    if user is None:
        return set()
    result = await session.execute(
        select(VacancyApplicationModel.vacancy_id).where(VacancyApplicationModel.user_id == user.id)
    )
    return {row[0] for row in result.all()}


def _to_payload(vacancy: VacancyModel, applied_ids: set[int], user: User | None) -> dict:
    payload = {
        column.key: getattr(vacancy, column.key) for column in VacancyModel.__table__.columns
    }
    payload["applied_by_me"] = (vacancy.id in applied_ids) if user is not None else None
    return payload


@router.get("", response_model=list[Vacancy])
async def list_vacancies(
    session: AsyncSession = Depends(get_session),
    user: User | None = Depends(get_optional_user),
) -> list[dict]:
    result = await session.execute(select(VacancyModel).order_by(VacancyModel.id))
    vacancies = list(result.scalars().all())
    applied = await _applied_vacancy_ids(session, user)
    return [_to_payload(v, applied, user) for v in vacancies]


@router.get("/{vacancy_id}", response_model=Vacancy)
async def get_vacancy(
    vacancy_id: int,
    session: AsyncSession = Depends(get_session),
    user: User | None = Depends(get_optional_user),
) -> dict:
    vacancy = await session.get(VacancyModel, vacancy_id)
    if vacancy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vacancy not found")
    applied = await _applied_vacancy_ids(session, user)
    return _to_payload(vacancy, applied, user)


@router.post(
    "/{vacancy_id}/apply",
    response_model=VacancyApplication,
    status_code=status.HTTP_201_CREATED,
)
async def apply_to_vacancy(
    vacancy_id: int,
    payload: VacancyApplicationCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> VacancyApplicationModel:
    vacancy = await session.get(VacancyModel, vacancy_id)
    if vacancy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vacancy not found")

    application = VacancyApplicationModel(
        vacancy_id=vacancy_id,
        user_id=user.id,
        message=payload.message.strip(),
    )
    session.add(application)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already applied to this vacancy",
        ) from None
    await session.refresh(application)
    return application


@router.delete("/{vacancy_id}/apply", status_code=status.HTTP_204_NO_CONTENT)
async def withdraw_vacancy_application(
    vacancy_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> None:
    result = await session.execute(
        select(VacancyApplicationModel).where(
            VacancyApplicationModel.vacancy_id == vacancy_id,
            VacancyApplicationModel.user_id == user.id,
        )
    )
    application = result.scalar_one_or_none()
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    await session.delete(application)
    await session.commit()


@router.get("/{vacancy_id}/my-application", response_model=VacancyApplication)
async def get_my_vacancy_application(
    vacancy_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> VacancyApplicationModel:
    result = await session.execute(
        select(VacancyApplicationModel).where(
            VacancyApplicationModel.vacancy_id == vacancy_id,
            VacancyApplicationModel.user_id == user.id,
        )
    )
    application = result.scalar_one_or_none()
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return application
