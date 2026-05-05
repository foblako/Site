"""Project likes table.

Revision ID: 0004_project_likes
Revises: 0003_user_profiles
Create Date: 2026-05-07
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0004_project_likes"
down_revision: str | None = "0003_user_profiles"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "project_likes",
        sa.Column("user_id", sa.String(length=36), primary_key=True),
        sa.Column("project_id", sa.String(length=64), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name="fk_project_likes_user_id", ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name="fk_project_likes_project_id",
            ondelete="CASCADE",
        ),
    )
    op.create_index("ix_project_likes_project_id", "project_likes", ["project_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_project_likes_project_id", table_name="project_likes")
    op.drop_table("project_likes")
