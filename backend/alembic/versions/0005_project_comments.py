"""Project comments table.

Revision ID: 0005_project_comments
Revises: 0004_project_likes
Create Date: 2026-05-08
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0005_project_comments"
down_revision: str | None = "0004_project_likes"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "project_comments",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("project_id", sa.String(length=64), nullable=False),
        sa.Column("author_id", sa.String(length=36), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name="fk_project_comments_project_id",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["author_id"],
            ["users.id"],
            name="fk_project_comments_author_id",
            ondelete="CASCADE",
        ),
    )
    op.create_index(
        "ix_project_comments_project_id",
        "project_comments",
        ["project_id"],
        unique=False,
    )
    op.create_index(
        "ix_project_comments_created_at",
        "project_comments",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_project_comments_created_at", table_name="project_comments")
    op.drop_index("ix_project_comments_project_id", table_name="project_comments")
    op.drop_table("project_comments")
