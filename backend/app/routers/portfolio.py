from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..deps import get_current_user
from ..models import Profile, User
from ..models.user_profile import UserProfile as UserProfileModel
from ..schemas.portfolio import UserProfile as UserProfileSchema
from ..schemas.portfolio import UserProfileUpdate

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("/default", response_model=UserProfileSchema)
async def get_default_portfolio(session: AsyncSession = Depends(get_session)) -> Profile:
    """Returns the seeded "default" profile that mirrors `DEFAULT_USER` in
    `src/data/portfolio.ts`. Anonymous visitors land here.
    """
    result = await session.execute(select(Profile).where(Profile.slug == "default").limit(1))
    profile = result.scalar_one_or_none()
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Default profile not seeded"
        )
    return profile


async def _load_default(session: AsyncSession) -> Profile:
    """Return the default profile row. The seed script guarantees it exists,
    but we still check so that a test DB without seed raises 503 instead of
    corrupting data with empty fields.
    """
    result = await session.execute(select(Profile).where(Profile.slug == "default").limit(1))
    profile = result.scalar_one_or_none()
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Default profile template is missing; seed the database first",
        )
    return profile


async def _get_or_create_user_profile(session: AsyncSession, user: User) -> UserProfileModel:
    existing = await session.get(UserProfileModel, user.id)
    if existing is not None:
        return existing

    template = await _load_default(session)
    # New user profiles start as a copy of the template with the user's own
    # display_name. Deep-copy the JSON fields so later edits don't mutate the
    # shared template document in memory.
    profile = UserProfileModel(
        user_id=user.id,
        name=user.display_name,
        info=[dict(item) for item in (template.info or [])],
        about=list(template.about or []),
        skills=list(template.skills or []),
        goals=list(template.goals or []),
        works=[dict(item) for item in (template.works or [])],
        contacts=dict(template.contacts or {}),
    )
    session.add(profile)
    await session.commit()
    await session.refresh(profile)
    return profile


@router.get("/me", response_model=UserProfileSchema)
async def get_my_portfolio(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> UserProfileModel:
    return await _get_or_create_user_profile(session, user)


@router.patch("/me", response_model=UserProfileSchema)
async def update_my_portfolio(
    payload: UserProfileUpdate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> UserProfileModel:
    profile = await _get_or_create_user_profile(session, user)

    data = payload.model_dump(exclude_unset=True)
    if "name" in data and data["name"] is not None:
        profile.name = data["name"]
    if "info" in data and data["info"] is not None:
        profile.info = [dict(item) for item in data["info"]]
    if "about" in data and data["about"] is not None:
        profile.about = list(data["about"])
    if "skills" in data and data["skills"] is not None:
        profile.skills = list(data["skills"])
    if "goals" in data and data["goals"] is not None:
        profile.goals = list(data["goals"])
    if "works" in data and data["works"] is not None:
        profile.works = [dict(item) for item in data["works"]]
    if "contacts" in data and data["contacts"] is not None:
        profile.contacts = dict(data["contacts"])

    await session.commit()
    await session.refresh(profile)
    return profile
