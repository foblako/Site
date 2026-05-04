from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path

import pytest

from app.config import Settings


@pytest.fixture
def clean_env(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> Iterator[Path]:
    """Run each settings test in an isolated working dir with no inherited
    CORS_ORIGINS / DATABASE_URL env vars or stray .env file.
    """
    monkeypatch.delenv("CORS_ORIGINS", raising=False)
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.chdir(tmp_path)
    yield tmp_path


def test_default_cors_origins(clean_env: Path) -> None:
    settings = Settings()
    assert settings.cors_origins == ["http://localhost:5173"]


def test_cors_origins_accepts_plain_string(
    clean_env: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:5173")
    settings = Settings()
    assert settings.cors_origins == ["http://localhost:5173"]


def test_cors_origins_accepts_csv(clean_env: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("CORS_ORIGINS", "http://a, http://b , http://c")
    settings = Settings()
    assert settings.cors_origins == ["http://a", "http://b", "http://c"]


def test_cors_origins_accepts_json_array(clean_env: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("CORS_ORIGINS", '["http://a","http://b"]')
    settings = Settings()
    assert settings.cors_origins == ["http://a", "http://b"]
