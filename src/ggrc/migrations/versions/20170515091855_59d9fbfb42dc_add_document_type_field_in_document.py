# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
add document_type field in Document

Create Date: 2017-05-15 09:18:55.392080
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op


# revision identifiers, used by Alembic.
revision = '59d9fbfb42dc'
down_revision = '1ac595e94a23'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.execute("ALTER TABLE documents ADD COLUMN document_type INT DEFAULT 1;")
  op.execute("Update documents set document_type = 2 where id in "
             "(select document_id from object_documents);")


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  op.execute("ALTER TABLE documents DROP COLUMN document_type;")
