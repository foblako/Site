from httpx import AsyncClient


async def test_list_projects_returns_summaries_in_camel_case(client: AsyncClient) -> None:
    response = await client.get("/api/projects")
    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, list)
    assert len(payload) >= 1
    project = payload[0]
    # camelCase contract: matches `ProjectSummary` in src/types/index.ts.
    assert set(project.keys()) == {
        "id",
        "title",
        "description",
        "image",
        "tags",
        "status",
        "statusIcon",
        "likes",
        "comments",
        "participants",
    }


async def test_get_project_detail(client: AsyncClient) -> None:
    response = await client.get("/api/projects/intellect-search")
    assert response.status_code == 200
    detail = response.json()
    assert detail["id"] == "intellect-search"
    assert detail["fullDescription"]
    assert isinstance(detail["team"], list)
    assert isinstance(detail["reviews"], list)
    assert "communityRating" in detail
    assert "expertsRating" in detail


async def test_get_unknown_project_returns_404(client: AsyncClient) -> None:
    response = await client.get("/api/projects/does-not-exist")
    assert response.status_code == 404
