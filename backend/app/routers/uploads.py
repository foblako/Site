from fastapi import APIRouter, Depends, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..deps import get_current_user
from ..models import User
from ..schemas.auth import UserOut
from ..uploads import save_image_upload

router = APIRouter(prefix="/users/me", tags=["uploads"])


@router.post("/avatar", response_model=UserOut)
async def upload_avatar(
    file: UploadFile,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> User:
    """Replace the authenticated user's avatar.

    The previous avatar file is intentionally left on disk — the `users`
    table only stores a URL, and tracking per-user history of prior avatars
    isn't worth the extra bookkeeping. A cleanup cron can sweep orphaned
    files later if storage becomes a concern.
    """
    url = await save_image_upload(file, subdir="avatars")
    user.avatar_url = url
    await session.commit()
    await session.refresh(user)
    return user


@router.delete("/avatar", response_model=UserOut)
async def delete_avatar(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> User:
    user.avatar_url = None
    await session.commit()
    await session.refresh(user)
    return user
