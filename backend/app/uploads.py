"""Filesystem storage for uploaded files.

Files live under `settings.uploads_dir` on the backend host and are served
back as static content mounted at `/uploads` (see `main.py`). Each call to
`save_upload` writes to a random UUID filename so we never have to worry
about collisions or the original filename containing path-traversal
fragments.

This module stays intentionally tiny — no Pillow/image rewriting — because
we just need to validate extension + size and hand the bytes off to disk.
Image re-encoding / resizing can be added later if storage costs matter.
"""

from __future__ import annotations

import secrets
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from .config import settings

# The maximum size is enforced *after* reading the file (we rely on the
# client to set Content-Length, but also double-check ourselves so a liar
# cannot blow up memory with a huge multipart body).
_ALLOWED_IMAGE_EXTENSIONS: frozenset[str] = frozenset({".png", ".jpg", ".jpeg", ".webp", ".gif"})
_ALLOWED_IMAGE_MIME_PREFIXES: tuple[str, ...] = ("image/",)


def _uploads_root() -> Path:
    root = Path(settings.uploads_dir).resolve()
    root.mkdir(parents=True, exist_ok=True)
    return root


def _subdir(name: str) -> Path:
    path = _uploads_root() / name
    path.mkdir(parents=True, exist_ok=True)
    return path


def _safe_extension(filename: str | None) -> str:
    if not filename:
        return ""
    return Path(filename).suffix.lower()


async def save_image_upload(file: UploadFile, subdir: str) -> str:
    """Validate and persist an image upload, returning a public `/uploads/...`
    URL callers can store in the database.
    """
    extension = _safe_extension(file.filename)
    if extension not in _ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only PNG, JPG, WEBP and GIF images are accepted.",
        )

    if file.content_type is not None and not any(
        file.content_type.startswith(prefix) for prefix in _ALLOWED_IMAGE_MIME_PREFIXES
    ):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Uploaded file must be an image.",
        )

    body = await file.read()
    if len(body) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty."
        )
    if len(body) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"File too large (max {settings.max_upload_size_bytes} bytes).",
        )

    target_dir = _subdir(subdir)
    # A random 32-char name is collision-free for all practical purposes
    # while also hiding the original filename from other users.
    filename = f"{secrets.token_hex(16)}{extension}"
    target_path = target_dir / filename
    target_path.write_bytes(body)

    return f"/uploads/{subdir}/{filename}"
