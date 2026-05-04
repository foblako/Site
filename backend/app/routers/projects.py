from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..models import Project
from ..schemas.project import ProjectDetail, ProjectSummary

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectSummary])
async def list_projects(session: AsyncSession = Depends(get_session)) -> list[Project]:
    result = await session.execute(select(Project).order_by(Project.likes.desc()))
    return list(result.scalars().all())


@router.get("/{project_id}", response_model=ProjectDetail)
async def get_project(project_id: str, session: AsyncSession = Depends(get_session)) -> Project:
    project = await session.get(Project, project_id)
    if project is None or not project.has_detail:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project
