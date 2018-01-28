# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Basic cache used by program & audit roles hooks"""

from ggrc.models import all_models


class AccessControlListCache(object):  # pylint: disable=R0903
  """Access Control List helper"""
  def __init__(self):
    self.cache = {}

  def add(self, obj, parent, person, role):
    """Add new item if it wasn't already added"""
    key = (obj.id, obj.type, person.id, role, parent.id)
    if key in self.cache:
      return self.cache[key]
    acl = all_models.AccessControlList(
        object_id=obj.id,
        object_type=obj.type,
        parent=parent,
        person=person,
        ac_role=role)
    self.cache[key] = acl
    if hasattr(obj, "access_control_list"):
      obj.access_control_list.append(acl)
    return acl