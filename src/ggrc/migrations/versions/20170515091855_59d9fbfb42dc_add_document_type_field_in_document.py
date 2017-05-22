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


INSERT_REL_SQL = """
INSERT INTO relationships (source_type, source_id, destination_type, destination_id)
(
    SELECT documentable_type AS source_type,
           documentable_id AS source_id,
           "Document" AS destination_type,
           document_id AS destination_id
    FROM object_documents WHERE not exists (
        SELECT 1
        FROM relationships
        WHERE source_type=documentable_type AND
              source_id=documentable_id AND
              destination_type="Document" AND
              destination_id=document_id
));
"""

def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.execute("ALTER TABLE documents ADD COLUMN document_type INT DEFAULT 1;")
  op.execute("Update documents set document_type = 2 where id in "
             "(select document_id from object_documents);")
  op.execute(INSERT_REL_SQL)



def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  op.execute("ALTER TABLE documents DROP COLUMN document_type;")
