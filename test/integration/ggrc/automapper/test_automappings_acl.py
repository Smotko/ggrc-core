# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test automappings acl"""

from sqlalchemy.orm import load_only

from ggrc import models
from ggrc.models import all_models
from integration.ggrc.models.factories import random_str
from integration.ggrc.automapper.automappings_base import AutomappingsBase

ROLES = {
    "Program Managers",
    "Program Editors",
    "Program Readers"
}
PROPAGATED_ROLES = {
    "Program Managers Mapped",
    "Program Editors Mapped",
    "Program Readers Mapped"
}


class TestACLAutomappings(AutomappingsBase):
  """Test automappings acl"""

  def setUp(self):
    super(TestACLAutomappings, self).setUp()
    users = {}
    for role in ROLES:
      _, users[role] = self.gen.generate_person(user_role="Creator")

    db_roles = all_models.AccessControlRole.query.filter(
        all_models.AccessControlRole.name.in_(
            ROLES | PROPAGATED_ROLES)
    ).options(
        load_only("id", "name")).all()

    self.role_map = {
        role.name: role.id for role in db_roles
    }

    self.program = self.create_object(models.Program, {
        'title': random_str(),
        'access_control_list': [{
            "ac_role_id": self.role_map[role],
            "person": {
                "id": users[role].id,
                "type": "Person"
            }
        } for role in ROLES]
    })
    self.regulation = self.create_object(models.Regulation, {
        'title': random_str(),
    })
    # Section is automapped to the program through destination
    self.destination_obj = self.create_object(models.Section, {
        'title': random_str(),
    })
    # Objective is automapped to the program through source
    self.source_obj = self.create_object(models.Objective, {
        'title': 'Objective',
    })

    # Create comments:
    self.comments = set()
    self.documents = set()
    for obj in (self.program, self.regulation,
                self.destination_obj, self.source_obj):
      comment = self.create_object(models.Comment, {
          'description': 'Hello!',
      })
      document = self.create_object(models.Document, {
          "document_type": "REFERENCE_URL",
          "link": random_str(),
          "title": random_str()
      })

      # Make sure we create comments both through destination and soruce:
      if obj in (self.program, self.regulation):
        self.create_mapping(obj, comment)
        self.create_mapping(obj, document)
      else:
        self.create_mapping(comment, obj)
        self.create_mapping(document, obj)
      self.comments.add(comment)
      self.documents.add(document)

    self.assert_mapping_implication(
        to_create=[
            (self.program, self.regulation),
            (self.source_obj, self.regulation),
            (self.regulation, self.destination_obj)
        ],
        implied=[(self.program, self.source_obj),
                 (self.program, self.destination_obj)]
    )

  def _acl_query(self, obj):
    """Helper function for generating the acl object query"""
    return all_models.AccessControlList.query.filter(
        all_models.AccessControlList.object_id == obj.id,
        all_models.AccessControlList.object_type == obj.type,
        all_models.AccessControlList.ac_role_id.in_([
            self.role_map[role] for role in PROPAGATED_ROLES])).all()

  def test_program_role_propagation(self):
    """Test if automappings also propagate program roles"""
    for obj in (self.source_obj, self.destination_obj):
      acls = self._acl_query(obj)
      self.assertEqual(len(acls), 3, "Roles not propagated to {}".format(
          obj.type))
      self.assertItemsEqual(PROPAGATED_ROLES, [
          acl.ac_role.name for acl in acls])

  def test_program_2nd_level(self):
    """Test if automappings also propagate program roles to 2nd level"""

    for obj in self.comments | self.documents:
      acls = self._acl_query(obj)
      self.assertEqual(len(acls), 3, "Roles not propagated to {}".format(
          obj.type
      ))
      self.assertItemsEqual(PROPAGATED_ROLES, [
          acl.ac_role.name for acl in acls])
