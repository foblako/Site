from __future__ import annotations

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def _register(client: AsyncClient, email: str) -> str:
    body = {"email": email, "password": "supersecret123", "displayName": email.split("@")[0]}
    await client.post("/api/auth/register", json=body)
    login = await client.post(
        "/api/auth/login", json={"email": email, "password": body["password"]}
    )
    return login.json()["accessToken"]


async def _pick_vacancy_id(client: AsyncClient) -> int:
    response = await client.get("/api/vacancies")
    return response.json()[0]["id"]


async def test_list_vacancies_anonymous_has_null_applied_flag(client: AsyncClient) -> None:
    response = await client.get("/api/vacancies")
    assert response.status_code == 200
    assert len(response.json()) > 0
    for vacancy in response.json():
        assert vacancy["appliedByMe"] is None


async def test_list_vacancies_authed_has_false_initially(client: AsyncClient) -> None:
    access = await _register(client, "anna@example.com")
    response = await client.get("/api/vacancies", headers={"Authorization": f"Bearer {access}"})
    assert response.status_code == 200
    for vacancy in response.json():
        assert vacancy["appliedByMe"] is False


async def test_apply_requires_auth(client: AsyncClient) -> None:
    vacancy_id = await _pick_vacancy_id(client)
    response = await client.post(f"/api/vacancies/{vacancy_id}/apply", json={"message": "hello"})
    assert response.status_code == 401


async def test_apply_happy_path(client: AsyncClient) -> None:
    access = await _register(client, "bob@example.com")
    vacancy_id = await _pick_vacancy_id(client)

    response = await client.post(
        f"/api/vacancies/{vacancy_id}/apply",
        headers={"Authorization": f"Bearer {access}"},
        json={"message": "Хочу у вас работать"},
    )
    assert response.status_code == 201, response.text
    payload = response.json()
    assert payload["vacancyId"] == vacancy_id
    assert payload["message"] == "Хочу у вас работать"

    listing = await client.get("/api/vacancies", headers={"Authorization": f"Bearer {access}"})
    for vacancy in listing.json():
        assert vacancy["appliedByMe"] is (vacancy["id"] == vacancy_id)

    mine = await client.get(
        f"/api/vacancies/{vacancy_id}/my-application",
        headers={"Authorization": f"Bearer {access}"},
    )
    assert mine.status_code == 200
    assert mine.json()["id"] == payload["id"]


async def test_apply_rejects_empty_message(client: AsyncClient) -> None:
    access = await _register(client, "clark@example.com")
    vacancy_id = await _pick_vacancy_id(client)
    response = await client.post(
        f"/api/vacancies/{vacancy_id}/apply",
        headers={"Authorization": f"Bearer {access}"},
        json={"message": ""},
    )
    assert response.status_code == 422


async def test_duplicate_apply_returns_409(client: AsyncClient) -> None:
    access = await _register(client, "dora@example.com")
    vacancy_id = await _pick_vacancy_id(client)
    first = await client.post(
        f"/api/vacancies/{vacancy_id}/apply",
        headers={"Authorization": f"Bearer {access}"},
        json={"message": "Первый"},
    )
    assert first.status_code == 201
    second = await client.post(
        f"/api/vacancies/{vacancy_id}/apply",
        headers={"Authorization": f"Bearer {access}"},
        json={"message": "Второй"},
    )
    assert second.status_code == 409


async def test_withdraw_then_reapply(client: AsyncClient) -> None:
    access = await _register(client, "eve@example.com")
    vacancy_id = await _pick_vacancy_id(client)
    await client.post(
        f"/api/vacancies/{vacancy_id}/apply",
        headers={"Authorization": f"Bearer {access}"},
        json={"message": "Первый"},
    )
    delete = await client.delete(
        f"/api/vacancies/{vacancy_id}/apply",
        headers={"Authorization": f"Bearer {access}"},
    )
    assert delete.status_code == 204

    again = await client.post(
        f"/api/vacancies/{vacancy_id}/apply",
        headers={"Authorization": f"Bearer {access}"},
        json={"message": "Второй"},
    )
    assert again.status_code == 201
    assert again.json()["message"] == "Второй"


async def test_withdraw_without_application_returns_404(client: AsyncClient) -> None:
    access = await _register(client, "frank@example.com")
    vacancy_id = await _pick_vacancy_id(client)
    response = await client.delete(
        f"/api/vacancies/{vacancy_id}/apply",
        headers={"Authorization": f"Bearer {access}"},
    )
    assert response.status_code == 404


async def test_apply_to_unknown_vacancy(client: AsyncClient) -> None:
    access = await _register(client, "grace@example.com")
    response = await client.post(
        "/api/vacancies/99999/apply",
        headers={"Authorization": f"Bearer {access}"},
        json={"message": "anything"},
    )
    assert response.status_code == 404


async def test_my_application_without_one_returns_404(client: AsyncClient) -> None:
    access = await _register(client, "hank@example.com")
    vacancy_id = await _pick_vacancy_id(client)
    response = await client.get(
        f"/api/vacancies/{vacancy_id}/my-application",
        headers={"Authorization": f"Bearer {access}"},
    )
    assert response.status_code == 404
