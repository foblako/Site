"""Initial schema.

Revision ID: 0001_initial
Revises:
Create Date: 2026-04-28
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0001_initial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "projects",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("image", sa.String(length=512), nullable=False),
        sa.Column("status", sa.String(length=64), nullable=False),
        sa.Column("status_icon", sa.String(length=512), nullable=False),
        sa.Column("likes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("comments", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("participants", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("tags", sa.JSON(), nullable=False),
        sa.Column("full_description", sa.Text(), nullable=True),
        sa.Column("start_date", sa.String(length=32), nullable=True),
        sa.Column("community_rating", sa.Float(), nullable=True),
        sa.Column("experts_rating", sa.Float(), nullable=True),
        sa.Column("screenshots", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("technologies", sa.JSON(), nullable=False),
        sa.Column("team", sa.JSON(), nullable=False),
        sa.Column("reviews", sa.JSON(), nullable=False),
        sa.Column("artifacts", sa.JSON(), nullable=False),
    )

    op.create_table(
        "vacancies",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("responsibilities", sa.Text(), nullable=False, server_default=""),
        sa.Column("tags", sa.JSON(), nullable=False),
        sa.Column("responsibilities_list", sa.JSON(), nullable=False),
    )

    op.create_table(
        "directions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=128), nullable=False, unique=True),
        sa.Column("technologies", sa.JSON(), nullable=False),
    )

    op.create_table(
        "hall_of_fame_stars",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=128), nullable=False),
        sa.Column("avatar", sa.String(length=512), nullable=False),
    )

    op.create_table(
        "department_contacts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("phone", sa.String(length=64), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
    )

    op.create_table(
        "profiles",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("slug", sa.String(length=64), nullable=False, unique=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("info", sa.JSON(), nullable=False),
        sa.Column("about", sa.JSON(), nullable=False),
        sa.Column("skills", sa.JSON(), nullable=False),
        sa.Column("goals", sa.JSON(), nullable=False),
        sa.Column("works", sa.JSON(), nullable=False),
        sa.Column("contacts", sa.JSON(), nullable=False),
        sa.Column("raw", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("profiles")
    op.drop_table("department_contacts")
    op.drop_table("hall_of_fame_stars")
    op.drop_table("directions")
    op.drop_table("vacancies")
    op.drop_table("projects")
