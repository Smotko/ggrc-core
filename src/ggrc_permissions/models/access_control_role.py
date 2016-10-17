# Copyright (C) 2016 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

""" Access Control Role Model"""

from ggrc import db
from ggrc.models.mixins import Described
from ggrc.models.mixins import ChangeTracked
from ggrc.models.mixins import Identifiable


class AccessControlRole(ChangeTracked, Described, Identifiable, db.Model):
  """A user role. All roles have a unique name. This name could be a simple
  string.
  """
  __tablename__ = 'access_control_roles'

  name = db.Column(db.String(128), nullable=False)
  read = db.Column(db.Boolean, default=None)
  edit = db.Column(db.Boolean, default=True)
  delete = db.Column(db.Boolean, default=True)
  create = db.Column(db.Boolean, default=True)
  admin = db.Column(db.Boolean, default=True)
  my_work = db.Column(db.Boolean, default=True)

  @staticmethod
  def _extra_table_args(_):
    return (
        db.UniqueConstraint(
            'name', name='uq_name_acess_control_roles'),)
