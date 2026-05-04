from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..models import Vacancy as VacancyModel
from ..schemas.vacancy import Vacancy

router = APIRouter(prefix="/vacancies", tags=["vacancies"])


@router.get("", response_model=list[Vacancy])
async def list_vacancies(session: AsyncSession = Depends(get_session)) -> list[VacancyModel]:
    result = await session.execute(select(VacancyModel).order_by(VacancyModel.id))
    return list(result.scalars().all())


@router.get("/{vacancy_id}", response_model=Vacancy)
async def get_vacancy(
    vacancy_id: int, session: AsyncSession = Depends(get_session)
) -> VacancyModel:
    vacancy = await session.get(VacancyModel, vacancy_id)
    if vacancy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vacancy not found")
    return vacancy
