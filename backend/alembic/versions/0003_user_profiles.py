"""User profiles table.

Revision ID: 0003_user_profiles
Revises: 0002_users
Create Date: 2026-05-06
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0003_user_profiles"
down_revision: str | None = "0002_users"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "user_profiles",
        sa.Column("user_id", sa.String(length=36), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("info", sa.JSON(), nullable=False),
        sa.Column("about", sa.JSON(), nullable=False),
        sa.Column("skills", sa.JSON(), nullable=False),
        sa.Column("goals", sa.JSON(), nullable=False),
        sa.Column("works", sa.JSON(), nullable=False),
        sa.Column("contacts", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name="fk_user_profiles_user_id", ondelete="CASCADE"
        ),
    )


def downgrade() -> None:
    op.drop_table("user_profiles")
