from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.db import get_session
from app.main import app
from app.models import User

pytestmark = pytest.mark.asyncio


async def _register(client: AsyncClient, email: str) -> str:
    body = {"email": email, "password": "supersecret123", "displayName": email.split("@")[0]}
    await client.post("/api/auth/register", json=body)
    login = await client.post(
        "/api/auth/login", json={"email": email, "password": body["password"]}
    )
    return login.json()["accessToken"]


async def _promote_to_admin(client: AsyncClient, email: str) -> None:
    """Flip the user's role to 'admin' directly in the test DB.

    We can't go through HTTP because there is no self-promotion endpoint
    (on purpose). Reuse the same dependency-override session the client is
    already wired to.
    """
    session_factory = app.dependency_overrides[get_session]
    async for session in session_factory():
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one()
        user.role = "admin"
        await session.commit()
        break


async def _admin_token(client: AsyncClient, email: str = "admin@example.com") -> str:
    token = await _register(client, email)
    await _promote_to_admin(client, email)
    # Re-login so the token carries the updated role claim — actually, tokens
    # don't embed the role (we re-fetch the user server-side), so the original
    # access token is fine.
    return token


# --------------------------------------------------------------------------- #
# Authentication / role gate
# --------------------------------------------------------------------------- #


async def test_admin_endpoints_require_auth(client: AsyncClient) -> None:
    response = await client.post(
        "/api/admin/projects",
        json={
            "id": "new-p",
            "title": "t",
            "description": "d",
            "image": "/x.png",
            "status": "В разработке",
            "statusIcon": "/s.svg",
        },
    )
    assert response.status_code == 401


async def test_admin_endpoints_require_admin_role(client: AsyncClient) -> None:
    access = await _register(client, "plain@example.com")
    response = await client.post(
        "/api/admin/projects",
        headers={"Authorization": f"Bearer {access}"},
        json={
            "id": "new-p",
            "title": "t",
            "description": "d",
            "image": "/x.png",
            "status": "В разработке",
            "statusIcon": "/s.svg",
        },
    )
    assert response.status_code == 403


# --------------------------------------------------------------------------- #
# Projects
# --------------------------------------------------------------------------- #


async def test_project_crud_round_trip(client: AsyncClient) -> None:
    token = await _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    create = await client.post(
        "/api/admin/projects",
        headers=headers,
        json={
            "id": "new-project",
            "title": "Новый проект",
            "description": "тестовое описание",
            "image": "/img.png",
            "status": "В разработке",
            "statusIcon": "/s.svg",
            "participants": 3,
            "tags": ["AI"],
            "fullDescription": "longer",
            "startDate": "2025-01-01",
            "communityRating": 4.2,
            "expertsRating": 4.5,
            "screenshots": 0,
            "technologies": ["python"],
            "team": [],
            "reviews": [],
            "artifacts": [],
        },
    )
    assert create.status_code == 201, create.text
    assert create.json()["id"] == "new-project"

    duplicate = await client.post(
        "/api/admin/projects",
        headers=headers,
        json={
            "id": "new-project",
            "title": "x",
            "description": "x",
            "image": "/x.png",
            "status": "в",
            "statusIcon": "/x.svg",
        },
    )
    assert duplicate.status_code == 409

    patch = await client.patch(
        "/api/admin/projects/new-project",
        headers=headers,
        json={"title": "Обновлённое имя", "participants": 10},
    )
    assert patch.status_code == 200
    assert patch.json()["title"] == "Обновлённое имя"
    assert patch.json()["participants"] == 10

    public = await client.get("/api/projects/new-project")
    assert public.status_code == 200
    assert public.json()["title"] == "Обновлённое имя"

    delete = await client.delete("/api/admin/projects/new-project", headers=headers)
    assert delete.status_code == 204
    after = await client.get("/api/projects/new-project")
    assert after.status_code == 404


# --------------------------------------------------------------------------- #
# Vacancies
# --------------------------------------------------------------------------- #


async def test_vacancy_crud_and_applications_list(client: AsyncClient) -> None:
    token = await _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    create = await client.post(
        "/api/admin/vacancies",
        headers=headers,
        json={
            "title": "Admin тест вакансия",
            "description": "desc",
            "tags": ["backend"],
            "responsibilities": "do things",
            "responsibilitiesList": ["code", "review"],
        },
    )
    assert create.status_code == 201
    vacancy_id = create.json()["id"]

    user_token = await _register(client, "applicant@example.com")
    apply = await client.post(
        f"/api/vacancies/{vacancy_id}/apply",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"message": "Хочу работать"},
    )
    assert apply.status_code == 201

    applications = await client.get(
        f"/api/admin/vacancies/{vacancy_id}/applications", headers=headers
    )
    assert applications.status_code == 200
    payload = applications.json()
    assert len(payload) == 1
    assert payload[0]["applicant"]["email"] == "applicant@example.com"
    assert payload[0]["message"] == "Хочу работать"

    patch = await client.patch(
        f"/api/admin/vacancies/{vacancy_id}",
        headers=headers,
        json={"title": "Другое название"},
    )
    assert patch.status_code == 200
    assert patch.json()["title"] == "Другое название"

    delete = await client.delete(f"/api/admin/vacancies/{vacancy_id}", headers=headers)
    assert delete.status_code == 204


# --------------------------------------------------------------------------- #
# Directions
# --------------------------------------------------------------------------- #


async def test_direction_crud_with_unique_name(client: AsyncClient) -> None:
    token = await _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    create = await client.post(
        "/api/admin/directions",
        headers=headers,
        json={"name": "DevOps тест", "technologies": ["docker"]},
    )
    assert create.status_code == 201
    direction_id = create.json()["id"]

    duplicate = await client.post(
        "/api/admin/directions",
        headers=headers,
        json={"name": "DevOps тест", "technologies": []},
    )
    assert duplicate.status_code == 409

    patch = await client.patch(
        f"/api/admin/directions/{direction_id}",
        headers=headers,
        json={"technologies": ["pytorch", "sklearn"]},
    )
    assert patch.status_code == 200
    assert patch.json()["technologies"] == ["pytorch", "sklearn"]

    delete = await client.delete(f"/api/admin/directions/{direction_id}", headers=headers)
    assert delete.status_code == 204


# --------------------------------------------------------------------------- #
# Hall of fame stars
# --------------------------------------------------------------------------- #


async def test_star_crud(client: AsyncClient) -> None:
    token = await _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    create = await client.post(
        "/api/admin/stars",
        headers=headers,
        json={"name": "Test Star", "role": "Инженер", "avatar": "/avatar.png"},
    )
    assert create.status_code == 201
    star_id = create.json()["id"]

    patch = await client.patch(
        f"/api/admin/stars/{star_id}",
        headers=headers,
        json={"role": "Senior инженер"},
    )
    assert patch.status_code == 200
    assert patch.json()["role"] == "Senior инженер"

    delete = await client.delete(f"/api/admin/stars/{star_id}", headers=headers)
    assert delete.status_code == 204
