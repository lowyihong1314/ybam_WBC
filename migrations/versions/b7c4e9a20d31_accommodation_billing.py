"""accommodation billing

Revision ID: b7c4e9a20d31
Revises: 16a3d158f775
Create Date: 2026-07-12 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b7c4e9a20d31'
down_revision = '16a3d158f775'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('register_data', sa.Column('accommodation_paid', sa.Boolean(), nullable=True, server_default=sa.text('false')))
    op.add_column('register_data', sa.Column('accommodation_bill_id', sa.String(length=100), nullable=True))
    op.add_column('register_data', sa.Column('accommodation_bill_url', sa.String(length=255), nullable=True))
    op.add_column('payment_transaction', sa.Column('purpose', sa.String(length=30), nullable=True, server_default='registration'))


def downgrade():
    op.drop_column('payment_transaction', 'purpose')
    op.drop_column('register_data', 'accommodation_bill_url')
    op.drop_column('register_data', 'accommodation_bill_id')
    op.drop_column('register_data', 'accommodation_paid')
