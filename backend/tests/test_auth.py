from __future__ import annotations

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


REGISTER_BODY = {
    "email": "alice@example.com",
    "password": "supersecret123",
    "displayName": "Alice",
}


async def test_register_creates_user(client: AsyncClient) -> None:
    response = await client.post("/api/auth/register", json=REGISTER_BODY)
    assert response.status_code == 201, response.text
    payload = response.json()
    assert set(payload.keys()) == {
        "id",
        "email",
        "displayName",
        "role",
        "avatarUrl",
        "createdAt",
    }
    assert payload["email"] == "alice@example.com"
    assert payload["displayName"] == "Alice"
    assert payload["role"] == "user"
    assert payload["id"]
    # Password must never be echoed back in any field.
    assert "password" not in payload
    assert "passwordHash" not in payload


async def test_register_normalises_email_case(client: AsyncClient) -> None:
    body = REGISTER_BODY | {"email": "Alice@EXAMPLE.com"}
    response = await client.post("/api/auth/register", json=body)
    assert response.status_code == 201
    assert response.json()["email"] == "alice@example.com"


async def test_register_rejects_duplicate_email(client: AsyncClient) -> None:
    first = await client.post("/api/auth/register", json=REGISTER_BODY)
    assert first.status_code == 201
    again = await client.post("/api/auth/register", json=REGISTER_BODY)
    assert again.status_code == 409
    assert "already exists" in again.json()["detail"].lower()


async def test_register_rejects_short_password(client: AsyncClient) -> None:
    body = REGISTER_BODY | {"password": "short"}
    response = await client.post("/api/auth/register", json=body)
    assert response.status_code == 422


async def test_login_returns_token_pair(client: AsyncClient) -> None:
    await client.post("/api/auth/register", json=REGISTER_BODY)
    response = await client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "supersecret123"},
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["tokenType"] == "bearer"
    assert payload["accessToken"]
    assert payload["refreshToken"]
    assert payload["accessToken"] != payload["refreshToken"]


async def test_login_wrong_password(client: AsyncClient) -> None:
    await client.post("/api/auth/register", json=REGISTER_BODY)
    response = await client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "wrong-password"},
    )
    assert response.status_code == 401


async def test_login_unknown_email(client: AsyncClient) -> None:
    response = await client.post(
        "/api/auth/login",
        json={"email": "nobody@example.com", "password": "supersecret123"},
    )
    assert response.status_code == 401


async def test_me_requires_token(client: AsyncClient) -> None:
    response = await client.get("/api/auth/me")
    assert response.status_code == 401


async def test_me_rejects_malformed_token(client: AsyncClient) -> None:
    response = await client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-real-jwt"})
    assert response.status_code == 401


async def test_me_returns_authenticated_user(client: AsyncClient) -> None:
    await client.post("/api/auth/register", json=REGISTER_BODY)
    login = await client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "supersecret123"},
    )
    access = login.json()["accessToken"]

    response = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {access}"})
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["email"] == "alice@example.com"
    assert payload["displayName"] == "Alice"


async def test_me_rejects_refresh_token(client: AsyncClient) -> None:
    """A refresh token must NOT be usable as an access token on /me."""
    await client.post("/api/auth/register", json=REGISTER_BODY)
    login = await client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "supersecret123"},
    )
    refresh = login.json()["refreshToken"]

    response = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {refresh}"})
    assert response.status_code == 401


async def test_refresh_returns_new_token_pair(client: AsyncClient) -> None:
    await client.post("/api/auth/register", json=REGISTER_BODY)
    login = await client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "supersecret123"},
    )
    refresh_token = login.json()["refreshToken"]

    response = await client.post("/api/auth/refresh", json={"refreshToken": refresh_token})
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["accessToken"]
    assert payload["refreshToken"]

    # New access token should work on /me.
    me = await client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {payload['accessToken']}"}
    )
    assert me.status_code == 200


async def test_refresh_rejects_access_token(client: AsyncClient) -> None:
    """Trying to use an access token where a refresh token is expected fails."""
    await client.post("/api/auth/register", json=REGISTER_BODY)
    login = await client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "supersecret123"},
    )
    access_token = login.json()["accessToken"]

    response = await client.post("/api/auth/refresh", json={"refreshToken": access_token})
    assert response.status_code == 401


async def test_refresh_rejects_garbage(client: AsyncClient) -> None:
    response = await client.post("/api/auth/refresh", json={"refreshToken": "this-is-not-a-jwt"})
    assert response.status_code == 401
