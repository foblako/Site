from __future__ import annotations

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


REGISTER_BODY = {
    "email": "liker@example.com",
    "password": "supersecret123",
    "displayName": "Liker",
}


async def _login(client: AsyncClient, body: dict[str, str] | None = None) -> str:
    payload = body or REGISTER_BODY
    await client.post("/api/auth/register", json=payload)
    response = await client.post(
        "/api/auth/login",
        json={"email": payload["email"], "password": payload["password"]},
    )
    return response.json()["accessToken"]


async def _pick_project_id(client: AsyncClient) -> str:
    response = await client.get("/api/projects")
    projects = response.json()
    assert projects, "seed data expected to contain at least one project"
    return projects[0]["id"]


async def test_list_projects_anonymous_has_null_liked_flag(client: AsyncClient) -> None:
    response = await client.get("/api/projects")
    assert response.status_code == 200
    for project in response.json():
        assert project["likedByMe"] is None


async def test_list_projects_authenticated_has_false_initially(client: AsyncClient) -> None:
    access = await _login(client)
    response = await client.get("/api/projects", headers={"Authorization": f"Bearer {access}"})
    assert response.status_code == 200
    for project in response.json():
        assert project["likedByMe"] is False


async def test_toggle_requires_auth(client: AsyncClient) -> None:
    project_id = await _pick_project_id(client)
    response = await client.post(f"/api/projects/{project_id}/like")
    assert response.status_code == 401


async def test_toggle_like_round_trip(client: AsyncClient) -> None:
    access = await _login(client)
    project_id = await _pick_project_id(client)

    initial = await client.get(
        f"/api/projects/{project_id}", headers={"Authorization": f"Bearer {access}"}
    )
    initial_count = initial.json()["likes"]
    assert initial.json()["likedByMe"] is False

    liked = await client.post(
        f"/api/projects/{project_id}/like",
        headers={"Authorization": f"Bearer {access}"},
    )
    assert liked.status_code == 200
    body = liked.json()
    assert body["liked"] is True
    assert body["likeCount"] == initial_count + 1

    # Second call toggles off.
    unliked = await client.post(
        f"/api/projects/{project_id}/like",
        headers={"Authorization": f"Bearer {access}"},
    )
    assert unliked.status_code == 200
    assert unliked.json() == {"liked": False, "likeCount": initial_count}


async def test_like_reflected_in_list(client: AsyncClient) -> None:
    access = await _login(client)
    project_id = await _pick_project_id(client)

    await client.post(
        f"/api/projects/{project_id}/like",
        headers={"Authorization": f"Bearer {access}"},
    )

    response = await client.get("/api/projects", headers={"Authorization": f"Bearer {access}"})
    target = next(p for p in response.json() if p["id"] == project_id)
    assert target["likedByMe"] is True


async def test_like_unknown_project_returns_404(client: AsyncClient) -> None:
    access = await _login(client)
    response = await client.post(
        "/api/projects/does-not-exist/like",
        headers={"Authorization": f"Bearer {access}"},
    )
    assert response.status_code == 404


async def test_likes_are_per_user(client: AsyncClient) -> None:
    access_a = await _login(client)
    project_id = await _pick_project_id(client)
    await client.post(
        f"/api/projects/{project_id}/like",
        headers={"Authorization": f"Bearer {access_a}"},
    )

    access_b = await _login(
        client,
        {"email": "other@example.com", "password": "supersecret123", "displayName": "Other"},
    )
    response = await client.get(
        f"/api/projects/{project_id}",
        headers={"Authorization": f"Bearer {access_b}"},
    )
    assert response.json()["likedByMe"] is False
