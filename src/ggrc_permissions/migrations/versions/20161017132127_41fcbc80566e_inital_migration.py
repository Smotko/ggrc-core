# Copyright (C) 2016 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Inital migration

Create Date: 2016-10-17 13:21:27.868341
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = '41fcbc80566e'
down_revision = None


def upgrade():
    """Upgrade database schema and/or data, creating a new revision."""
    op.create_table(
        'access_control_roles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('read', sa.Boolean(), nullable=True),
        sa.Column('edit', sa.Boolean(), nullable=True),
        sa.Column('delete', sa.Boolean(), nullable=True),
        sa.Column('create', sa.Boolean(), nullable=True),
        sa.Column('admin', sa.Boolean(), nullable=True),
        sa.Column('my_work', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('modified_by_id', sa.Integer(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name', name='uq_name_acess_control_roles')
    )
    op.create_index(
        'ix_access_control_roles_updated_at',
        'access_control_roles',
        ['updated_at'],
        unique=False)
    op.create_table(
        'access_control_list',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('person_id', sa.Integer(), nullable=False),
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.Column('parent_id', sa.Integer(), nullable=True),
        sa.Column('resource_id', sa.Integer(), nullable=True),
        sa.Column('resource_type', sa.String(length=250), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('modified_by_id', sa.Integer(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['parent_id'], ['access_control_list.id'], ),
        sa.ForeignKeyConstraint(['person_id'], ['people.id'], ),
        sa.ForeignKeyConstraint(['role_id'], ['access_control_roles.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(
        'ix_access_control_list_updated_at',
        'access_control_list',
        ['updated_at'],
        unique=False)
    op.create_index(
        'person_id_idx',
        'access_control_list',
        ['person_id'],
        unique=False)
    op.create_index(
        'resource_id_type_idx',
        'access_control_list',
        ['resource_id',
         'resource_type'],
        unique=False)
    op.create_index(
        'resource_type_idx',
        'access_control_list',
        ['resource_type'],
        unique=False)
    op.create_index(
        'role_id_idx',
        'access_control_list',
        ['role_id'],
        unique=False)


def downgrade():
    """Downgrade database schema and/or data back to the previous revision."""
    op.drop_index('role_id_idx', table_name='access_control_list')
    op.drop_index('resource_type_idx', table_name='access_control_list')
    op.drop_index('resource_id_type_idx', table_name='access_control_list')
    op.drop_index('person_id_idx', table_name='access_control_list')
    op.drop_index('ix_access_control_list_updated_at',
                  table_name='access_control_list')
    op.drop_table('access_control_list')
    op.drop_index('ix_access_control_roles_updated_at',
                  table_name='access_control_roles')
    op.drop_table('access_control_roles')
