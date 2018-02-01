# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test automappings acl"""

from sqlalchemy.orm import load_only

from ggrc import models
from ggrc.models import all_models
from integration.ggrc.models.factories import random_str
from integration.ggrc.automapper.automappings_base import AutomappingsBase


class TestACLAutomappings(AutomappingsBase):
  """Test automappings acl"""
  def setUp(self):
    super(TestACLAutomappings, self).setUp()

  def test_program_role_propagation(self):
    """Test if automappings also propagate program roles"""
    roles = {
        "Program Managers",
        "Program Editors",
        "Program Readers"
    }
    propagated_roles = {
        "Program Managers Mapped",
        "Program Editors Mapped",
        "Program Readers Mapped"
    }
    users = {}
    for role in roles:
      _, users[role] = self.gen.generate_person(user_role="Creator")

    db_roles = all_models.AccessControlRole.query.filter(
        all_models.AccessControlRole.name.in_(roles | propagated_roles)
    ).options(
        load_only("id", "name")).all()

    role_map = {
        role.name: role.id for role in db_roles
    }

    program = self.create_object(models.Program, {
        'title': random_str(),
        'access_control_list': [{
            "ac_role_id": role_map[role],
            "person": {
                "id": users[role].id,
                "type": "Person"
            }
        } for role in roles]
    })
    regulation = self.create_object(models.Regulation, {
        'title': random_str(),
    })
    # Section is automapped to the program through destination
    destination_obj = self.create_object(models.Section, {
        'title': random_str(),
    })
    # Objective is automapped to the program through source
    source_obj = self.create_object(models.Objective, {
        'title': 'Objective',
    })
    self.assert_mapping_implication(
        to_create=[
            (program, regulation),
            (source_obj, regulation),
            (regulation, destination_obj)
        ],
        implied=[(program, source_obj), (program, destination_obj)]
    )
    for obj in (source_obj, destination_obj):
      acls = all_models.AccessControlList.query.filter(
          all_models.AccessControlList.object_id == obj.id,
          all_models.AccessControlList.object_type == obj.type,
          all_models.AccessControlList.ac_role_id.in_([
              role_map[role] for role in propagated_roles])).all()
      self.assertEqual(len(acls), 3)
      self.assertItemsEqual(propagated_roles, [
          acl.ac_role.name for acl in acls])
