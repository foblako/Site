"""Vacancy applications table.

Revision ID: 0006_vacancy_applications
Revises: 0005_project_comments
Create Date: 2026-05-09
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0006_vacancy_applications"
down_revision: str | None = "0005_project_comments"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "vacancy_applications",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("vacancy_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["vacancy_id"],
            ["vacancies.id"],
            name="fk_vacancy_applications_vacancy_id",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name="fk_vacancy_applications_user_id",
            ondelete="CASCADE",
        ),
        sa.UniqueConstraint("vacancy_id", "user_id", name="uq_vacancy_applications_vacancy_user"),
    )
    op.create_index(
        "ix_vacancy_applications_vacancy_id",
        "vacancy_applications",
        ["vacancy_id"],
        unique=False,
    )
    op.create_index(
        "ix_vacancy_applications_user_id",
        "vacancy_applications",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_vacancy_applications_user_id", table_name="vacancy_applications")
    op.drop_index("ix_vacancy_applications_vacancy_id", table_name="vacancy_applications")
    op.drop_table("vacancy_applications")
