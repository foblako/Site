from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..deps import get_current_user
from ..models import Project, ProjectComment, User
from ..schemas.comment import Comment, CommentAuthor, CommentCreate

router = APIRouter(prefix="/projects/{project_id}/comments", tags=["comments"])


async def _ensure_project_exists(session: AsyncSession, project_id: str) -> Project:
    project = await session.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


def _to_schema(comment: ProjectComment, author: User) -> Comment:
    return Comment(
        id=comment.id,
        body=comment.body,
        created_at=comment.created_at,
        author=CommentAuthor(id=author.id, display_name=author.display_name),
    )


@router.get("", response_model=list[Comment])
async def list_project_comments(
    project_id: str, session: AsyncSession = Depends(get_session)
) -> list[Comment]:
    """Public — anonymous visitors can read but not write."""
    await _ensure_project_exists(session, project_id)

    result = await session.execute(
        select(ProjectComment, User)
        .join(User, User.id == ProjectComment.author_id)
        .where(ProjectComment.project_id == project_id)
        .order_by(ProjectComment.created_at.desc())
    )
    return [_to_schema(comment, author) for comment, author in result.all()]


@router.post("", response_model=Comment, status_code=status.HTTP_201_CREATED)
async def create_project_comment(
    project_id: str,
    payload: CommentCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> Comment:
    project = await _ensure_project_exists(session, project_id)

    comment = ProjectComment(project_id=project_id, author_id=user.id, body=payload.body.strip())
    session.add(comment)
    project.comments = (project.comments or 0) + 1
    await session.commit()
    await session.refresh(comment)
    return _to_schema(comment, user)


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project_comment(
    project_id: str,
    comment_id: str,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> None:
    comment = await session.get(ProjectComment, comment_id)
    if comment is None or comment.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    if comment.author_id != user.id and user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own comments",
        )

    project = await session.get(Project, project_id)
    if project is not None:
        project.comments = max((project.comments or 0) - 1, 0)

    await session.delete(comment)
    await session.commit()
