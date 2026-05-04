from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..models import Direction as DirectionModel
from ..schemas.direction import Direction

router = APIRouter(prefix="/directions", tags=["directions"])


@router.get("", response_model=list[Direction])
async def list_directions(session: AsyncSession = Depends(get_session)) -> list[DirectionModel]:
    result = await session.execute(select(DirectionModel).order_by(DirectionModel.id))
    return list(result.scalars().all())
