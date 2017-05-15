# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

# pylint: disable=maybe-no-member, invalid-name

"""Test request import and updates."""

from ggrc import models

from integration.ggrc import TestCase


class TestControlsImport(TestCase):
  """Basic Assessment import tests with.

  This test suite should test new Assessment imports, exports, and updates.
  The main focus of these tests is checking error messages for invalid state
  transitions.
  """

  def setUp(self):
    """Set up for Assessment test cases."""
    super(TestControlsImport, self).setUp()
    self.client.get("/login")

  def test_import_controls_with_evidence(self):
    """Test importing of assessments with templates."""

    response = self.import_file("controls_no_warnings.csv")
    self._check_csv_response(response, {})

    evidence = models.Document.query.filter_by(title="Some title 3").all()
    self.assertEqual(len(evidence), 1)
    control = models.Control.query.filter_by(slug="control-3").first()
    self.assertEqual(control.document_evidence[0].title, "Some title 3")
