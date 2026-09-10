"""merge SIH game fields head with the photo/comfort-memory merge head

Revision ID: c7a1e93f2b4d
Revises: f22cd5281c9a, af50f103f49d
Create Date: 2026-09-10 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c7a1e93f2b4d'
down_revision: Union[str, Sequence[str], None] = ('f22cd5281c9a', 'af50f103f49d')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
