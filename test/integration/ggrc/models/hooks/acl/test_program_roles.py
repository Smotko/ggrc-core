# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test Access Control Propagation for Program Roles like
   Program Managers, Program Editors & Program Readers"""

from collections import defaultdict
from sqlalchemy.sql.expression import tuple_

from ggrc import db
from ggrc.models import all_models
from integration.ggrc import TestCase
from integration.ggrc.models import factories
from integration.ggrc_basic_permissions.models \
    import factories as rbac_factories


PROGRAM_ROLES = {
    "Program Managers": "Program Managers Mapped",
    "Program Editors": "Program Managers Reader",
    "Program Readers": "Program Managers Reader",
}


class TestAuditRoleProgation(TestCase):
  """TestAuditRoleProgation"""

  def setup_people(self):
    """Setup people and global roles"""
    creator_role = all_models.Role.query.filter(
        all_models.Role.name == 'Creator'
    ).one()

    for person in PROGRAM_ROLES:
      self.people[person] = factories.PersonFactory()
      rbac_factories.UserRoleFactory(
          role=creator_role,
          person=self.people[person]
      )

  def setup_objects(self):
    """Sets up all the objects needed by the tests"""
    objects = self.objects
    # Program
    objects['program'] = factories.ProgramFactory(
        title="A Program",
        access_control_list=[{
            "ac_role": self.roles[role],
            "person": self.people[role]
        } for role in PROGRAM_ROLES])
    # Controls
    objects['controls'] = [
        factories.ControlFactory(title="My First Control"),
        factories.ControlFactory(title="My Second Control")
    ]

    # Comments
    objects['control_comments'] = [
        factories.CommentFactory(description="First Control Comment"),
        factories.CommentFactory(description="Second Control Comment")
    ]

    objects['control_documents'] = [
        factories.DocumentFactory(document_type='REFERENCE_URL',
                                  title="First Control Ref"),
        factories.DocumentFactory(document_type='REFERENCE_URL',
                                  title="Second Control Ref")
    ]
    # Documents
    objects['program_comment'] = factories.CommentFactory(
        description="Program comment")
    objects['program_document'] = factories.DocumentFactory(
        document_type='REFERENCE_URL',
        title="Program ref")

  def setup_mappings(self):
    """Sets up all the mappings needed by the tests"""
    objects = self.objects
    first_control, second_control = objects['controls']

    # First control gets the document/comment mapping BEFORE
    # the mapping to program
    for obj in (objects['control_comments'][0],
                objects['control_documents'][0]):
      factories.RelationshipFactory(
          source=obj,
          destination=first_control)

    # Map both controls to program:
    for control in objects['controls']:
      factories.RelationshipFactory(
          source=objects['program'],
          destination=control)

    # Second control gets the document/comment mapping AFTER
    # the mapping to program
    for obj in (objects['control_comments'][1],
                objects['control_documents'][1]):
      factories.RelationshipFactory(
          destination=obj,
          source=second_control)

    # Map comment and document to program
    for obj in (objects['program_comment'],
                objects['program_document']):
      factories.RelationshipFactory(
          source=objects['program'],
          destination=obj)

  def setUp(self):
    super(TestAuditRoleProgation, self).setUp()
    self.roles = {
        role.name: role for role in all_models.AccessControlRole.query.filter(
        ).all()
    }
    self.people = {}
    self.objects = {}
    with factories.single_commit():
      self.setup_people()
      self.setup_objects()
      self.setup_mappings()

  def test_comment_documents(self):
    """Test document and comment role propagation"""
    # 3 created comments & documents should all have 3 program mapped roles
    # each, 18 roles in total
    count = all_models.AccessControlList.query.filter(
        all_models.AccessControlList.object_type.in_(['Comment', 'Document'])
    ).count()
    self.assertEquals(count, 18)
