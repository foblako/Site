from httpx import AsyncClient


async def test_list_vacancies(client: AsyncClient) -> None:
    response = await client.get("/api/vacancies")
    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, list)
    assert len(payload) >= 1
    vacancy = payload[0]
    assert set(vacancy.keys()) == {
        "id",
        "title",
        "description",
        "tags",
        "responsibilities",
        "responsibilitiesList",
        "appliedByMe",
    }


async def test_get_vacancy(client: AsyncClient) -> None:
    response = await client.get("/api/vacancies/1")
    assert response.status_code == 200
    assert response.json()["id"] == 1


async def test_get_unknown_vacancy_returns_404(client: AsyncClient) -> None:
    response = await client.get("/api/vacancies/9999")
    assert response.status_code == 404
