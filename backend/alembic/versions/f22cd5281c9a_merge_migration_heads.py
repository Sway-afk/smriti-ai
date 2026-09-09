"""merge migration heads

Revision ID: f22cd5281c9a
Revises: 8ca5e17c47c6, ba826c50f337
Create Date: 2026-09-09 12:50:01.788819

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f22cd5281c9a'
down_revision: Union[str, Sequence[str], None] = ('8ca5e17c47c6', 'ba826c50f337')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
