"""Add ESG task fields

Revision ID: add_esg_task_fields
Revises: 
Create Date: 2024-07-16 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY

# revision identifiers, used by Alembic.
revision = 'add_esg_task_fields'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Add new enum types
    task_priority_enum = sa.Enum('HIGH', 'MEDIUM', 'LOW', name='taskpriority')
    task_type_enum = sa.Enum('COMPLIANCE', 'MONITORING', 'IMPROVEMENT', name='tasktype')
    
    task_priority_enum.create(op.get_bind(), checkfirst=True)
    task_type_enum.create(op.get_bind(), checkfirst=True)
    
    # Add new columns to tasks table
    op.add_column('tasks', sa.Column('priority', sa.Enum('HIGH', 'MEDIUM', 'LOW', name='taskpriority'), nullable=False, server_default='MEDIUM'))
    op.add_column('tasks', sa.Column('task_type', sa.Enum('COMPLIANCE', 'MONITORING', 'IMPROVEMENT', name='tasktype'), nullable=False, server_default='COMPLIANCE'))
    op.add_column('tasks', sa.Column('required_evidence_count', sa.Integer(), nullable=False, server_default='1'))
    op.add_column('tasks', sa.Column('estimated_hours', sa.Integer(), nullable=True))
    op.add_column('tasks', sa.Column('regulatory_requirement', sa.String(), nullable=False, server_default='false'))
    op.add_column('tasks', sa.Column('sector', sa.String(), nullable=True))
    op.add_column('tasks', sa.Column('recurring_frequency', sa.String(), nullable=True))
    op.add_column('tasks', sa.Column('phase_dependency', sa.String(), nullable=True))


def downgrade():
    # Remove columns
    op.drop_column('tasks', 'phase_dependency')
    op.drop_column('tasks', 'recurring_frequency')
    op.drop_column('tasks', 'sector')
    op.drop_column('tasks', 'regulatory_requirement')
    op.drop_column('tasks', 'estimated_hours')
    op.drop_column('tasks', 'required_evidence_count')
    op.drop_column('tasks', 'task_type')
    op.drop_column('tasks', 'priority')
    
    # Drop enum types
    sa.Enum(name='tasktype').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='taskpriority').drop(op.get_bind(), checkfirst=True)