"""workshop ranking

Revision ID: c4f1a9d7e226
Revises: b7c4e9a20d31
Create Date: 2026-07-30 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c4f1a9d7e226'
down_revision = 'b7c4e9a20d31'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('register_data', sa.Column('workshop_rank_1', sa.Integer(), nullable=True))
    op.add_column('register_data', sa.Column('workshop_rank_2', sa.Integer(), nullable=True))
    op.add_column('register_data', sa.Column('workshop_rank_3', sa.Integer(), nullable=True))


def downgrade():
    op.drop_column('register_data', 'workshop_rank_3')
    op.drop_column('register_data', 'workshop_rank_2')
    op.drop_column('register_data', 'workshop_rank_1')
