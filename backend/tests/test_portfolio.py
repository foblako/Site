from __future__ import annotations

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


REGISTER_BODY = {
    "email": "alice@example.com",
    "password": "supersecret123",
    "displayName": "Alice",
}


async def _login(client: AsyncClient) -> str:
    await client.post("/api/auth/register", json=REGISTER_BODY)
    response = await client.post(
        "/api/auth/login",
        json={"email": REGISTER_BODY["email"], "password": REGISTER_BODY["password"]},
    )
    assert response.status_code == 200
    return response.json()["accessToken"]


async def test_default_portfolio_is_still_public(client: AsyncClient) -> None:
    response = await client.get("/api/portfolio/default")
    assert response.status_code == 200
    payload = response.json()
    assert payload["name"]
    assert isinstance(payload["info"], list)
    assert isinstance(payload["skills"], list)


async def test_me_portfolio_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/portfolio/me")
    assert response.status_code == 401


async def test_me_portfolio_autocreates_from_template(client: AsyncClient) -> None:
    access = await _login(client)

    response = await client.get(
        "/api/portfolio/me", headers={"Authorization": f"Bearer {access}"}
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    # Name seeded from user's display_name, not the template placeholder.
    assert payload["name"] == REGISTER_BODY["displayName"]
    # Remaining fields are cloned from the default template.
    default_response = await client.get("/api/portfolio/default")
    default_payload = default_response.json()
    assert payload["info"] == default_payload["info"]
    assert payload["skills"] == default_payload["skills"]


async def test_me_portfolio_patch_updates_name(client: AsyncClient) -> None:
    access = await _login(client)

    patch = await client.patch(
        "/api/portfolio/me",
        headers={"Authorization": f"Bearer {access}"},
        json={"name": "Alice the Great"},
    )
    assert patch.status_code == 200, patch.text
    assert patch.json()["name"] == "Alice the Great"

    # Verify it persists on a fresh GET.
    again = await client.get(
        "/api/portfolio/me", headers={"Authorization": f"Bearer {access}"}
    )
    assert again.json()["name"] == "Alice the Great"


async def test_me_portfolio_patch_is_partial(client: AsyncClient) -> None:
    access = await _login(client)

    # Initial GET captures the template-cloned skills/goals.
    initial = await client.get(
        "/api/portfolio/me", headers={"Authorization": f"Bearer {access}"}
    )
    original_skills = initial.json()["skills"]

    # Patch only about; skills must remain untouched.
    patch = await client.patch(
        "/api/portfolio/me",
        headers={"Authorization": f"Bearer {access}"},
        json={"about": ["line one", "line two"]},
    )
    assert patch.status_code == 200
    updated = patch.json()
    assert updated["about"] == ["line one", "line two"]
    assert updated["skills"] == original_skills


async def test_me_portfolio_patch_replaces_arrays(client: AsyncClient) -> None:
    access = await _login(client)

    patch = await client.patch(
        "/api/portfolio/me",
        headers={"Authorization": f"Bearer {access}"},
        json={"skills": ["python", "rust"], "goals": ["ship v1"]},
    )
    assert patch.status_code == 200
    body = patch.json()
    assert body["skills"] == ["python", "rust"]
    assert body["goals"] == ["ship v1"]


async def test_me_portfolio_patch_isolation_between_users(client: AsyncClient) -> None:
    """Two users get independent profiles."""
    access_a = await _login(client)
    await client.patch(
        "/api/portfolio/me",
        headers={"Authorization": f"Bearer {access_a}"},
        json={"name": "Alice edited"},
    )

    # Register + login second user.
    other = REGISTER_BODY | {"email": "bob@example.com", "displayName": "Bob"}
    await client.post("/api/auth/register", json=other)
    login_b = await client.post(
        "/api/auth/login",
        json={"email": "bob@example.com", "password": other["password"]},
    )
    access_b = login_b.json()["accessToken"]

    bob = await client.get(
        "/api/portfolio/me", headers={"Authorization": f"Bearer {access_b}"}
    )
    # Bob's profile is seeded fresh from the template with Bob's name.
    assert bob.json()["name"] == "Bob"

    alice = await client.get(
        "/api/portfolio/me", headers={"Authorization": f"Bearer {access_a}"}
    )
    assert alice.json()["name"] == "Alice edited"


async def test_me_portfolio_patch_rejects_invalid_contacts(client: AsyncClient) -> None:
    access = await _login(client)
    response = await client.patch(
        "/api/portfolio/me",
        headers={"Authorization": f"Bearer {access}"},
        json={"contacts": {"phone": "123"}},  # missing email + website
    )
    assert response.status_code == 422
