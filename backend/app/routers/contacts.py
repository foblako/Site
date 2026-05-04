from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..models import DepartmentContact
from ..schemas.contacts import DepartmentContacts

router = APIRouter(prefix="/contacts", tags=["contacts"])


@router.get("/department", response_model=DepartmentContacts)
async def get_department_contacts(
    session: AsyncSession = Depends(get_session),
) -> DepartmentContact:
    result = await session.execute(select(DepartmentContact).limit(1))
    contact = result.scalar_one_or_none()
    if contact is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Department contacts not configured"
        )
    return contact
