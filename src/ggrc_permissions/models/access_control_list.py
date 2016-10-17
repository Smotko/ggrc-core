# Copyright (C) 2016 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

""" Access Control List Model"""

from ggrc import db
from ggrc.models.mixins import ChangeTracked
from ggrc.models.mixins import Identifiable


class AccessControlList(Identifiable, ChangeTracked, db.Model):
  """A user control list.
  """
  __tablename__ = 'access_control_list'

  person_id = db.Column(db.Integer, db.ForeignKey('people.id'), nullable=False)
  role_id = db.Column(db.Integer, db.ForeignKey('access_control_roles.id'),
                      nullable=False)
  parent_id = db.Column(db.Integer, db.ForeignKey('access_control_list.id'),
                        nullable=True, default=None)
  resource_id = db.Column(db.Integer, nullable=True, default=None)
  resource_type = db.Column(db.String, nullable=True, default=None)

  # TODO: Make sure delete propagation works when deleting roles, parent acl,
  #       resource_id, person_id...
  # role = db.relationship(
  #     'AccessControlRole',
  #     backref=backref('access_control_list', cascade='all, delete-orphan'))
  #
  # parent = db.relationship(
  #     'AccessControlList',
  #     backref=backref('child', cascade='all, delete-orphan'))

  @staticmethod
  def _extra_table_args(_):
    return (
        db.Index(
            'person_id_idx',
            'person_id'),
        db.Index(
            'role_id_idx',
            'role_id'),
        db.Index(
            'resource_id_type_idx',
            'resource_id', 'resource_type'),
        db.Index(
            'resource_type_idx',
            'resource_type')
    )
