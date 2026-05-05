from __future__ import annotations

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


PROJECT_ID = "intellect-search"  # seeded by app.seed


async def _register(client: AsyncClient, email: str) -> str:
    body = {"email": email, "password": "supersecret123", "displayName": email.split("@")[0]}
    await client.post("/api/auth/register", json=body)
    login = await client.post(
        "/api/auth/login", json={"email": email, "password": body["password"]}
    )
    return login.json()["accessToken"]


async def test_list_comments_public_empty(client: AsyncClient) -> None:
    response = await client.get(f"/api/projects/{PROJECT_ID}/comments")
    assert response.status_code == 200
    assert response.json() == []


async def test_list_comments_unknown_project_returns_404(client: AsyncClient) -> None:
    response = await client.get("/api/projects/does-not-exist/comments")
    assert response.status_code == 404


async def test_post_comment_requires_auth(client: AsyncClient) -> None:
    response = await client.post(f"/api/projects/{PROJECT_ID}/comments", json={"body": "hi"})
    assert response.status_code == 401


async def test_post_comment_happy_path(client: AsyncClient) -> None:
    access = await _register(client, "alice@example.com")

    response = await client.post(
        f"/api/projects/{PROJECT_ID}/comments",
        headers={"Authorization": f"Bearer {access}"},
        json={"body": "Отличный проект!"},
    )
    assert response.status_code == 201, response.text
    payload = response.json()
    assert payload["body"] == "Отличный проект!"
    assert payload["author"]["displayName"] == "alice"
    assert "createdAt" in payload
    assert payload["id"]

    listing = await client.get(f"/api/projects/{PROJECT_ID}/comments")
    assert len(listing.json()) == 1
    assert listing.json()[0]["id"] == payload["id"]

    # Project.comments counter reflects the new comment on the summary GET.
    project = await client.get(f"/api/projects/{PROJECT_ID}")
    assert project.json()["comments"] >= 1


async def test_post_comment_rejects_empty_body(client: AsyncClient) -> None:
    access = await _register(client, "bob@example.com")
    response = await client.post(
        f"/api/projects/{PROJECT_ID}/comments",
        headers={"Authorization": f"Bearer {access}"},
        json={"body": ""},
    )
    assert response.status_code == 422


async def test_delete_own_comment(client: AsyncClient) -> None:
    access = await _register(client, "carol@example.com")
    posted = await client.post(
        f"/api/projects/{PROJECT_ID}/comments",
        headers={"Authorization": f"Bearer {access}"},
        json={"body": "temporary"},
    )
    comment_id = posted.json()["id"]

    delete = await client.delete(
        f"/api/projects/{PROJECT_ID}/comments/{comment_id}",
        headers={"Authorization": f"Bearer {access}"},
    )
    assert delete.status_code == 204

    listing = await client.get(f"/api/projects/{PROJECT_ID}/comments")
    assert listing.json() == []


async def test_cannot_delete_foreign_comment(client: AsyncClient) -> None:
    access_a = await _register(client, "dave@example.com")
    posted = await client.post(
        f"/api/projects/{PROJECT_ID}/comments",
        headers={"Authorization": f"Bearer {access_a}"},
        json={"body": "Dave wrote this"},
    )
    comment_id = posted.json()["id"]

    access_b = await _register(client, "eve@example.com")
    response = await client.delete(
        f"/api/projects/{PROJECT_ID}/comments/{comment_id}",
        headers={"Authorization": f"Bearer {access_b}"},
    )
    assert response.status_code == 403

    listing = await client.get(f"/api/projects/{PROJECT_ID}/comments")
    assert len(listing.json()) == 1


async def test_delete_unknown_comment_returns_404(client: AsyncClient) -> None:
    access = await _register(client, "frank@example.com")
    response = await client.delete(
        f"/api/projects/{PROJECT_ID}/comments/does-not-exist",
        headers={"Authorization": f"Bearer {access}"},
    )
    assert response.status_code == 404
