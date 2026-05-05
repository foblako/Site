from __future__ import annotations

from pathlib import Path

import pytest
from httpx import AsyncClient

from app.config import settings

pytestmark = pytest.mark.asyncio


# Minimal PNG header + IDAT + IEND, 1x1 red pixel. ~67 bytes; enough for
# the upload handler to accept it by extension + content-type.
_ONE_PIXEL_PNG = bytes.fromhex(
    "89504E470D0A1A0A"
    "0000000D49484452000000010000000108060000001F15C489"
    "0000000D4944415478DA63F8CFC0F00F000301010066CC2F28"
    "0000000049454E44AE426082"
)


async def _register(client: AsyncClient, email: str) -> str:
    body = {"email": email, "password": "supersecret123", "displayName": email.split("@")[0]}
    await client.post("/api/auth/register", json=body)
    login = await client.post(
        "/api/auth/login", json={"email": email, "password": body["password"]}
    )
    return login.json()["accessToken"]


@pytest.fixture
def uploads_tmp(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    monkeypatch.setattr(settings, "uploads_dir", str(tmp_path))
    return tmp_path


async def test_upload_avatar_requires_auth(client: AsyncClient, uploads_tmp: Path) -> None:
    response = await client.post(
        "/api/users/me/avatar",
        files={"file": ("avatar.png", _ONE_PIXEL_PNG, "image/png")},
    )
    assert response.status_code == 401


async def test_upload_avatar_happy_path(client: AsyncClient, uploads_tmp: Path) -> None:
    access = await _register(client, "ivan@example.com")
    response = await client.post(
        "/api/users/me/avatar",
        headers={"Authorization": f"Bearer {access}"},
        files={"file": ("avatar.png", _ONE_PIXEL_PNG, "image/png")},
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["avatarUrl"].startswith("/uploads/avatars/")
    assert payload["avatarUrl"].endswith(".png")

    # File actually landed on disk under the tmp uploads dir.
    relative = payload["avatarUrl"].removeprefix("/uploads/")
    disk_path = uploads_tmp / relative
    assert disk_path.exists()
    assert disk_path.read_bytes() == _ONE_PIXEL_PNG

    # /api/auth/me reflects the new URL.
    me = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {access}"})
    assert me.json()["avatarUrl"] == payload["avatarUrl"]


async def test_upload_avatar_rejects_bad_extension(client: AsyncClient, uploads_tmp: Path) -> None:
    access = await _register(client, "oleg@example.com")
    response = await client.post(
        "/api/users/me/avatar",
        headers={"Authorization": f"Bearer {access}"},
        files={"file": ("shell.exe", b"MZ\x90\x00", "application/octet-stream")},
    )
    assert response.status_code == 415


async def test_upload_avatar_rejects_non_image_mime(client: AsyncClient, uploads_tmp: Path) -> None:
    access = await _register(client, "nina@example.com")
    response = await client.post(
        "/api/users/me/avatar",
        headers={"Authorization": f"Bearer {access}"},
        files={"file": ("pic.png", _ONE_PIXEL_PNG, "text/plain")},
    )
    assert response.status_code == 415


async def test_upload_avatar_rejects_empty_file(client: AsyncClient, uploads_tmp: Path) -> None:
    access = await _register(client, "pavel@example.com")
    response = await client.post(
        "/api/users/me/avatar",
        headers={"Authorization": f"Bearer {access}"},
        files={"file": ("pic.png", b"", "image/png")},
    )
    assert response.status_code == 400


async def test_upload_avatar_rejects_oversized_file(
    client: AsyncClient, uploads_tmp: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    # Shrink the limit so the test doesn't have to generate a 5 MiB payload.
    monkeypatch.setattr(settings, "max_upload_size_bytes", 64)
    access = await _register(client, "roman@example.com")
    response = await client.post(
        "/api/users/me/avatar",
        headers={"Authorization": f"Bearer {access}"},
        files={"file": ("big.png", b"\x89PNG" + b"0" * 256, "image/png")},
    )
    assert response.status_code == 413


async def test_delete_avatar(client: AsyncClient, uploads_tmp: Path) -> None:
    access = await _register(client, "sonia@example.com")
    upload = await client.post(
        "/api/users/me/avatar",
        headers={"Authorization": f"Bearer {access}"},
        files={"file": ("avatar.png", _ONE_PIXEL_PNG, "image/png")},
    )
    assert upload.json()["avatarUrl"] is not None

    delete = await client.delete(
        "/api/users/me/avatar", headers={"Authorization": f"Bearer {access}"}
    )
    assert delete.status_code == 200
    assert delete.json()["avatarUrl"] is None
