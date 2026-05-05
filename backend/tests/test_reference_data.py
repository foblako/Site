from httpx import AsyncClient


async def test_directions(client: AsyncClient) -> None:
    response = await client.get("/api/directions")
    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, list)
    assert all(set(item.keys()) == {"id", "name", "technologies"} for item in payload)


async def test_hall_of_fame(client: AsyncClient) -> None:
    response = await client.get("/api/hall-of-fame")
    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, list)
    assert all(set(item.keys()) == {"id", "name", "role", "avatar"} for item in payload)


async def test_department_contacts(client: AsyncClient) -> None:
    response = await client.get("/api/contacts/department")
    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"phone", "email"}


async def test_default_portfolio(client: AsyncClient) -> None:
    response = await client.get("/api/portfolio/default")
    assert response.status_code == 200
    body = response.json()
    assert {"name", "info", "about", "skills", "goals", "works", "contacts"} <= set(body.keys())
    assert set(body["contacts"].keys()) == {"phone", "email", "website"}
