from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..models import Profile
from ..schemas.portfolio import UserProfile

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("/default", response_model=UserProfile)
async def get_default_portfolio(session: AsyncSession = Depends(get_session)) -> Profile:
    """Returns the seeded "default" profile that mirrors `DEFAULT_USER` in
    `src/data/portfolio.ts`. Real per-user portfolios will land with auth.
    """
    result = await session.execute(select(Profile).where(Profile.slug == "default").limit(1))
    profile = result.scalar_one_or_none()
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Default profile not seeded"
        )
    return profile
