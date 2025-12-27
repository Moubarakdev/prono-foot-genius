"""Add OTP and verification columns to User

Revision ID: e1d4d0a7a0b1
Revises: 02397a2fb688
Create Date: 2025-12-27 13:10:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'e1d4d0a7a0b1'
down_revision: Union[str, None] = '02397a2fb688'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add columns for OTP and account verification
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), nullable=False, server_default=sa.text('0')))
    op.add_column('users', sa.Column('otp_code', sa.String(length=10), nullable=True))
    op.add_column('users', sa.Column('otp_expires_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    # Remove columns
    op.drop_column('users', 'otp_expires_at')
    op.drop_column('users', 'otp_code')
    op.drop_column('users', 'is_verified')
