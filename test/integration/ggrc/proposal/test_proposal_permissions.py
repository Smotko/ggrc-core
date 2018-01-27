# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test for proposal permissions."""

import ddt

from ggrc.models import all_models
from ggrc.models import proposal as proposal_model

from integration.ggrc import TestCase
from integration.ggrc.api_helper import Api
from integration.ggrc.models import factories
from integration.ggrc_basic_permissions.models \
    import factories as rbac_factories


@ddt.ddt
class TestPermissions(TestCase):
  """Test checks permissions for proposals."""

  def setUp(self):
    super(TestPermissions, self).setUp()
    self.api = Api()
    roles = {r.name: r for r in all_models.Role.query.all()}
    ac_roles = {r.name: r for r in all_models.AccessControlRole.query.all()}
    with factories.single_commit():
      self.control = factories.ControlFactory()
      acrs = {
          "ACL_Reader": factories.AccessControlRoleFactory(
              name="ACL_Reader",
              object_type="Control",
              update=0),
          "ACL_Editor": factories.AccessControlRoleFactory(
              name="ACL_Editor",
              object_type="Control"),
      }
      self.program = factories.ProgramFactory()
      self.program.context.related_object = self.program
      self.relationship = factories.RelationshipFactory(
          source=self.program,
          destination=self.control,
          context=self.program.context,
      )
      self.people = {
          "Creator": factories.PersonFactory(),
          "Reader": factories.PersonFactory(),
          "Editor": factories.PersonFactory(),
          "Administrator": factories.PersonFactory(),
          "ACL_Reader": factories.PersonFactory(),
          "ACL_Editor": factories.PersonFactory(),
          "Program Editors": factories.PersonFactory(),
          "Program Managers": factories.PersonFactory(),
          "Program Readers": factories.PersonFactory(),
      }
      for role_name in ["Creator", "Reader", "Editor", "Administrator"]:
        rbac_factories.UserRoleFactory(role=roles[role_name],
                                       person=self.people[role_name])
      for role_name in ["Program Editors",
                        "Program Managers",
                        "Program Readers"]:
        person = self.people[role_name]
        rbac_factories.UserRoleFactory(role=roles["Creator"], person=person)
        factories.AccessControlListFactory(
            ac_role=ac_roles[role_name],
            object=self.program,
            person=self.people[role_name])
      self.proposal = factories.ProposalFactory(
          instance=self.control,
          content={
              "access_control_list": {},
              "custom_attribute_values": {},
              "fields": {},
              "mapping_fields": {},
              "mapping_list_fields": {},
          }
      )
      for role_name in ["ACL_Reader", "ACL_Editor"]:
        rbac_factories.UserRoleFactory(role=roles["Creator"],
                                       person=self.people[role_name])
        factories.AccessControlListFactory(
            ac_role=acrs[role_name],
            object=self.control,
            person=self.people[role_name])
      proposal_model.set_acl_to_all_proposals_for(self.control)

  @ddt.data(
      ("Creator", 403),
      ("Reader", 200),
      ("Editor", 200),
      ("ACL_Reader", 200),
      ("ACL_Editor", 200),
      ("Administrator", 200),
      ("Program Editors", 200),
      ("Program Managers", 200),
      ("Program Readers", 200),
  )
  @ddt.unpack
  def test_permissions_on_get(self, role_name, status):
    """Test get proposals for {0}."""
    proposal_id = self.proposal.id
    self.api.set_user(self.people[role_name])
    self.client.get("/login")
    resp = self.api.get(all_models.Proposal, proposal_id)
    self.assertEqual(status, resp.status_code)

  def api_proposal_status_change(self, proposal_id, status):
    return self.api.put(all_models.Proposal.query.get(proposal_id),
                        {"proposal": {"status": status}})

  @ddt.data(
      ("Creator", 403),
      ("Reader", 403),
      ("Editor", 200),
      ("Administrator", 200),
      ("ACL_Reader", 403),
      ("ACL_Editor", 200),
      ("Program Editors", 200),
      ("Program Managers", 200),
      ("Program Readers", 403)
  )
  @ddt.unpack
  def test_permissions_on_apply(self, role_name, status):
    """Test apply proposals for {0}."""
    proposal_id = self.proposal.id
    self.api.set_user(self.people[role_name])
    self.client.get("/login")
    resp = self.api_proposal_status_change(proposal_id,
                                           all_models.Proposal.STATES.APPLIED)
    self.assertEqual(status, resp.status_code)

  @ddt.data(
      ("Creator", 403),
      ("Reader", 403),
      ("Editor", 200),
      ("ACL_Reader", 403),
      ("ACL_Editor", 200),
      ("Administrator", 200),
      ("Program Editors", 200),
      ("Program Managers", 200),
      ("Program Readers", 403),
  )
  @ddt.unpack
  def test_permissions_on_decline(self, role_name, status):
    """Test decline proposals for {0}."""
    proposal_id = self.proposal.id
    self.api.set_user(self.people[role_name])
    self.client.get("/login")
    resp = self.api_proposal_status_change(proposal_id,
                                           all_models.Proposal.STATES.DECLINED)
    self.assertEqual(status, resp.status_code)

  @ddt.data(
      ("Creator", 403),
      ("Reader", 201),
      ("Editor", 201),
      ("ACL_Reader", 201),
      ("ACL_Editor", 201),
      ("Administrator", 201),
      ("Program Editors", 201),
      ("Program Managers", 201),
      ("Program Readers", 201),
  )
  @ddt.unpack
  def test_permissions_on_create(self, role_name, status):
    """Test create proposal for {0}."""
    data = {
        "proposal": {
            "instance": {
                "id": self.control.id,
                "type": self.control.type,
            },
            "full_instance_content": {"title": "new_title"},
            "agenda": "update cav",
            "context": None,
        }
    }
    self.api.set_user(self.people[role_name])
    self.client.get("/login")
    resp = self.api.post(all_models.Proposal, data)
    self.assertEqual(status, resp.status_code)
