from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..models import HallOfFameStar as StarModel
from ..schemas.hall_of_fame import HallOfFameStar

router = APIRouter(prefix="/hall-of-fame", tags=["hall-of-fame"])


@router.get("", response_model=list[HallOfFameStar])
async def list_stars(session: AsyncSession = Depends(get_session)) -> list[StarModel]:
    result = await session.execute(select(StarModel).order_by(StarModel.id))
    return list(result.scalars().all())
