from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..deps import get_current_user, get_optional_user
from ..models import Project, ProjectLike, User
from ..schemas.project import ProjectDetail, ProjectLikeResponse, ProjectSummary

router = APIRouter(prefix="/projects", tags=["projects"])


async def _liked_project_ids(session: AsyncSession, user: User | None) -> set[str]:
    if user is None:
        return set()
    result = await session.execute(
        select(ProjectLike.project_id).where(ProjectLike.user_id == user.id)
    )
    return {row[0] for row in result.all()}


def _attach_liked_flag(project: Project, liked_ids: set[str], user: User | None) -> dict:
    """Merge the ORM row with the per-user `likedByMe` flag into a dict the
    response models can serialize. We avoid mutating the ORM instance in case
    SQLAlchemy tries to flush the phantom attribute later.
    """
    payload = {column.key: getattr(project, column.key) for column in Project.__table__.columns}
    payload["liked_by_me"] = (project.id in liked_ids) if user is not None else None
    return payload


@router.get("", response_model=list[ProjectSummary])
async def list_projects(
    session: AsyncSession = Depends(get_session),
    user: User | None = Depends(get_optional_user),
) -> list[dict]:
    result = await session.execute(select(Project).order_by(Project.likes.desc()))
    projects = list(result.scalars().all())
    liked = await _liked_project_ids(session, user)
    return [_attach_liked_flag(p, liked, user) for p in projects]


@router.get("/{project_id}", response_model=ProjectDetail)
async def get_project(
    project_id: str,
    session: AsyncSession = Depends(get_session),
    user: User | None = Depends(get_optional_user),
) -> dict:
    project = await session.get(Project, project_id)
    if project is None or not project.has_detail:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    liked = await _liked_project_ids(session, user)
    return _attach_liked_flag(project, liked, user)


@router.post("/{project_id}/like", response_model=ProjectLikeResponse)
async def toggle_project_like(
    project_id: str,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> ProjectLikeResponse:
    project = await session.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    existing = await session.get(ProjectLike, (user.id, project_id))
    if existing is None:
        session.add(ProjectLike(user_id=user.id, project_id=project_id))
        project.likes = (project.likes or 0) + 1
        liked = True
    else:
        await session.delete(existing)
        project.likes = max((project.likes or 0) - 1, 0)
        liked = False

    await session.commit()
    await session.refresh(project)
    return ProjectLikeResponse(liked=liked, like_count=project.likes)
