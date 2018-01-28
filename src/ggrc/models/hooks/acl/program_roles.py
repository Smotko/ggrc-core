# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""All hooks required by program acl roles business cases"""


import sqlalchemy as sa
from sqlalchemy.orm import load_only
from sqlalchemy.orm.session import Session

from ggrc.models import all_models
from ggrc.models.hooks.acl.cache import AccessControlListCache
from ggrc.models.relationship import Stub, RelationshipsCache
from ggrc.models.hooks.relationship import related


def _get_acr_id(acl):
  """Get acr id from acl object"""
  if acl.ac_role_id is not None:
    return acl.ac_role_id
  if acl.ac_role is not None:
    return acl.ac_role.id
  return None


def related_to(rel, types):
  """Relate help"""
  source, destination = rel.source, rel.destination
  if source.type in types:
    return source, destination
  elif destination.type in types:
    return destination, source
  return None, None


def _get_program_roles():
  """Get a an dict of program roles"""
  roles = all_models.AccessControlRole.query.filter().options(
      load_only("id", "name")).all()
  res = {
      role.name: role.id for role in roles
  }
  res.update({role.id: role.name for role in roles})
  return res


class ProgramRolesHandler(object):
  """Handle program role propagation"""

  def __init__(self):
    self.caches = {}
    self.done = set()

  def handle_snapshots(self, _, acl):
    """Handle audit propagation"""
    acl_cache = self.caches["access_control_list_cache"]
    for snapshot in acl.object.snapshotted_objects:
      acl_cache.add(
          snapshot, acl, acl.person, acl.ac_role_id)

  def _get_acr_name(self, acl):
    """Hello"""
    role_map = self.caches["program_roles"]
    id_ = _get_acr_id(acl)
    return role_map[id_]

  def handle_audits(self, propagation, acl):
    """Handle audit propagation"""
    role_map = self.caches["program_roles"]
    acl_cache = self.caches["access_control_list_cache"]
    for audit in acl.object.audits:
      child = acl_cache.add(audit, acl, acl.person,
                            role_map[self._get_acr_name(acl) + " Mapped"])
      if "propagate" in propagation:
        self.handle_propagation(propagation["propagate"], child)

  def handle_relationships(self, propagation, acl):
    """Hanle relationships"""
    relationship_cache = self.caches["relationship_cache"]
    role_map = self.caches["program_roles"]
    acl_cache = self.caches["access_control_list_cache"]
    program_stub = Stub(acl.object_type, acl.object_id)
    related_stubs = related([program_stub], relationship_cache)
    for stub in related_stubs[program_stub]:
      if not (propagation["type"] == "any" or
              stub.type in propagation["type"].split(",")):
        continue
      if propagation["new_role"] == "same":
        role_id = _get_acr_id(acl)
      elif propagation["new_role"] == "add mapped":
        role_id = role_map[self._get_acr_name(acl) + " Mapped"]
      else:
        raise Exception("Wrong value for new_role field " +
                        propagation["new_role"])
      child = acl_cache.add(
          stub, acl, acl.person, role_id)
      if "propagate" in propagation:
        self.handle_propagation(propagation["propagate"], child)

  def handle_propagation(self, propagation, acl):
    """Handle propagation dict"""
    name = self._get_acr_name(acl)
    if name not in propagation["roles"]:
      return
    if "relationships" in propagation:
      self.handle_relationships(propagation["relationships"], acl)
    if "audits" in propagation:
      self.handle_audits(propagation["audits"], acl)
    if "snapshots" in propagation:
      self.handle_snapshots(propagation["snapshots"], acl)

  def handle_access_control_list(self, obj):
    """Handle cases where new program roles are added

      Program Readers, Program Editors, Program Managers

      - Mapped objects (through relationships)
        - Comments & Documents
      - Audit
        - Assessment Templates
        - Snapshots
        - Assessments
          - Comments & Documents
        - Issues
          - Comments & Documents
    """
    propagation = {
        "roles": {
            "Program Managers",
            "Program Readers",
            "Program Editors"
        },
        "relationships": {
            "type": "any",
            "new_role": "add mapped",
            "propagate": {
                "roles": {
                    "Program Managers Mapped",
                    "Program Readers Mapped",
                    "Program Editors Mapped"
                },
                "relationships": {
                    "type": "Comment,Document",
                    "new_role": "same"
                }
            }
        },
        "audits": {
            "propagate": {
                "roles": {
                    "Program Managers Mapped",
                    "Program Readers Mapped",
                    "Program Editors Mapped"
                },
                "relationships": {
                    "type": "Assessment,Issue,AssessmentTemplate",
                    "new_role": "same",
                    "propagate": {
                        "roles": {
                            "Program Managers Mapped",
                            "Program Readers Mapped",
                            "Program Editors Mapped"
                        },
                        "relationships": {
                            "type": "Comment,Document",
                            "new_role": "same"
                        }
                    }
                },
                "snapshots": {

                }
            }
        }
    }
    self.handle_propagation(propagation, obj)

  def handle_snapshot(self, obj):
    """When a snapshot is created propagate program roles"""
    access_control_list = obj.parent.access_control_list
    for acl in access_control_list:
      if acl.ac_role.name not in {
          "Program Readers Mapped",
          "Program Editors Mapped",
          "Program Managers Mapped"
      }:
        continue
      acl_cache = self.caches["access_control_list_cache"]
      acl_cache.add(obj, acl, acl.person, acl.ac_role.id)

  def handle_crelationships(self, obj):
    """Handle relationships"""
    acl_cache = self.caches["access_control_list_cache"]
    role_map = self.caches["program_roles"]
    program, other = related_to(obj, "Program")
    if program:
      for acl in program.access_control_list:
        role_name = self._get_acr_name(acl)
        if role_name not in {
            "Program Readers",
            "Program Editors",
            "Program Managers"
        }:
          continue

        acl_cache.add(other, acl, acl.person, role_map[role_name + " Mapped"])
      return

    comment_or_document, other = related_to(obj, {
        "Document",
        "Comment"})
    if comment_or_document:
      for acl in other.access_control_list:
        if self._get_acr_name(acl) not in {
            "Program Readers Mapped",
            "Program Editors Mapped",
            "Program Managers Mapped"
        }:
          continue
        acl_cache.add(comment_or_document, acl, acl.person, _get_acr_id(acl))
      return

    assessment_or_issue, other = related_to(obj, {
        "Assessment",
        "Issue",
        "AssessmentTemplate"})
    if assessment_or_issue:
      for acl in other.access_control_list:
        if self._get_acr_name(acl) not in {
            "Program Readers Mapped",
            "Program Editors Mapped",
            "Program Managers Mapped"
        }:
          continue
        acl_cache.add(assessment_or_issue, acl, acl.person, _get_acr_id(acl))
      return

  def handle_audit_creation(self, obj):
    """Doc"""
    acl_cache = self.caches["access_control_list_cache"]
    role_map = self.caches["program_roles"]
    for acl in obj.program.access_control_list:
      role_name = self._get_acr_name(acl)
      if role_name not in {
          "Program Readers",
          "Program Editors",
          "Program Managers"
      }:
        continue
      acl_cache.add(obj, acl, acl.person, role_map[role_name + " Mapped"])

  def after_flush(self, session, _):
    """Handle program related acl"""
    self.caches = {
        "access_control_list_cache": AccessControlListCache(),
        "relationship_cache": RelationshipsCache(),
        "program_roles": _get_program_roles()
    }
    handlers = {
        all_models.AccessControlList: self.handle_access_control_list,
        all_models.Snapshot: self.handle_snapshot,
        all_models.Relationship: self.handle_crelationships,
        all_models.Audit: self.handle_audit_creation
    }
    for obj in session.new:
      handler = handlers.get(type(obj))
      if callable(handler):
        if obj not in self.done:
          handler(obj)
          self.done.add(obj)


def init_hook():
  """Initialize AccessControlList-related hooks."""
  handler = ProgramRolesHandler()
  sa.event.listen(Session, "after_flush", handler.after_flush)
