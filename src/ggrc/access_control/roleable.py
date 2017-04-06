# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Roleable model"""

from sqlalchemy import orm
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.ext.hybrid import hybrid_property
from ggrc.access_control.list import AccessControlList
from ggrc import db


class Roleable(object):
  """Roleable"""

  _update_raw = _include_links = _publish_attrs = [
      'access_control_list'
  ]

  @declared_attr
  def _access_control_list(self):
    """access_control_list"""
    joinstr = 'and_(remote(AccessControlList.object_id) == {type}.id, '\
        'remote(AccessControlList.object_type) == "{type}")'
    joinstr = joinstr.format(type=self.__name__)
    return db.relationship(
        'AccessControlList',
        primaryjoin=joinstr,
        foreign_keys='AccessControlList.object_id',
        backref='{0}_object'.format(self.__name__),
        cascade='all, delete-orphan')

  @hybrid_property
  def access_control_list(self):
    return self._access_control_list

  def _remove_existing(self, existing, values):
    """Helper function for removing existing items in acl"""
    for value in values:
      acr_id = value['ac_role_id']
      person_id = value['person']['id']
      if existing.ac_role_id == acr_id and existing.person_id == person_id:
        return
    self.access_control_list.remove(existing)

  def _set_value(self, value):
    """Helper function for setting value of acl"""
    for itm in self.access_control_list:
      acr_id = value['ac_role_id']
      person_id = value['person']['id']
      if itm.ac_role_id == acr_id and itm.person_id == person_id:
        return
    AccessControlList(
        object=self,
        person_id=value.get('person').get('id'),
        ac_role_id=value.get('ac_role_id')
    )

  @access_control_list.setter
  def access_control_list(self, values):
    """Setter function for access control list.

    Args:
      value: List of access control roles or dicts containing json
        representation of custom attribute values.
    """
    if values is None:
      return
    for existing in self.access_control_list:
      self._remove_existing(existing, values)
    for value in values:
      self._set_value(value)

  @classmethod
  def eager_query(cls):
    """Eager Query"""
    query = super(Roleable, cls).eager_query()
    return cls.eager_inclusions(query, Roleable._include_links).options(
        orm.subqueryload('access_control_list'))

  def log_json(self):
    """Log custom attribute values."""
    # pylint: disable=not-an-iterable
    res = super(Roleable, self).log_json()
    res["access_control_list"] = [
        value.log_json() for value in self.access_control_list]
    return res