# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test automappings issue"""

from ggrc.models import all_models
from integration.ggrc import TestCase
from integration.ggrc.models import factories


class TestIssueAutomappings(TestCase):
  """Test suite for Issue-related automappings."""
  # pylint: disable=invalid-name

  def setUp(self):
    super(TestIssueAutomappings, self).setUp()

    # TODO: replace this hack with a special test util
    from ggrc.login import noop
    noop.login()  # this is needed to pass the permission checks in automapper

    snapshottable = factories.ControlFactory()
    with factories.single_commit():
      self.audit, self.asmt, self.snapshot = self._make_audit_asmt_snapshot(
          snapshottable,
      )

      self.issue = factories.IssueFactory()
      self.issue_audit = factories.IssueFactory()
      self.issue_snapshot = factories.IssueFactory()

      factories.RelationshipFactory(source=self.issue_audit,
                                    destination=self.audit)

      # to map an Issue to a Snapshot, you first should map it to Audit
      factories.RelationshipFactory(source=self.issue_snapshot,
                                    destination=self.audit)
      factories.RelationshipFactory(source=self.issue_snapshot,
                                    destination=self.snapshot)

  @staticmethod
  def _make_audit_asmt_snapshot(snapshottable):
    """Make Audit, Assessment, Snapshot and map them correctly."""
    audit = factories.AuditFactory()
    assessment = factories.AssessmentFactory(audit=audit)

    revision = all_models.Revision.query.filter(
        all_models.Revision.resource_id == snapshottable.id,
        all_models.Revision.resource_type == snapshottable.type,
    ).first()
    snapshot = factories.SnapshotFactory(
        parent=audit,
        revision_id=revision.id,
        child_type=snapshottable.type,
        child_id=snapshottable.id,
    )

    # Audit-Assessment Relationship is created only on Assessment POST
    factories.RelationshipFactory(source=audit, destination=assessment)
    factories.RelationshipFactory(source=assessment, destination=snapshot)

    return audit, assessment, snapshot

  @staticmethod
  def _ordered_pairs_from_relationships(relationships):
    """Make list of ordered src, dst from a list of Relationship objects."""
    def order(src, dst):
      return ((src, dst) if (src.type, src.id) < (dst.type, dst.id) else
              (dst, src))

    return [order(r.source, r.destination) for r in relationships]

  @classmethod
  def _get_automapped_relationships(cls):
    """Get list of ordered src, dst mapped by the only automapping."""
    automapping = all_models.Automapping.query.one()
    automapped = all_models.Relationship.query.filter(
        all_models.Relationship.automapping_id == automapping.id,
    ).all()
    return cls._ordered_pairs_from_relationships(automapped)

  def test_issue_assessment_automapping(self):
    """Issue is automapped to Audit and Snapshot."""
    factories.RelationshipFactory(source=self.issue,
                                  destination=self.asmt)

    automapped = self._get_automapped_relationships()

    self.assertItemsEqual(automapped,
                          [(self.audit, self.issue),
                           (self.issue, self.snapshot)])

  def test_issue_assessment_automapping_no_audit(self):
    """Issue is automapped to Snapshot if Audit already mapped."""
    factories.RelationshipFactory(source=self.issue_audit,
                                  destination=self.asmt)

    automapped = self._get_automapped_relationships()

    self.assertItemsEqual(automapped,
                          [(self.issue_audit, self.snapshot)])

  def test_issue_assessment_automapping_all_mapped(self):
    """Issue is not automapped to Snapshot and Audit if already mapped."""
    factories.RelationshipFactory(source=self.issue_snapshot,
                                  destination=self.asmt)

    self.assertEqual(all_models.Automapping.query.count(), 0)
