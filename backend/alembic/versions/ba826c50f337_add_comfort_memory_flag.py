"""add comfort memory flag

Revision ID: ba826c50f337
Revises: 7fdda0c2a9b8
Create Date: 2026-09-08 19:17:42.304207

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "ba826c50f337"
down_revision: Union[str, Sequence[str], None] = "7fdda0c2a9b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "memories",
        sa.Column(
            "is_comfort_memory",
            sa.Boolean(),
            nullable=False,
            server_default="false",
        ),
    )


def downgrade() -> None:
    op.drop_column("memories", "is_comfort_memory")