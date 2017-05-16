# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Integration tests for Document"""

from ggrc.models import all_models
from integration.ggrc import TestCase
from integration.ggrc.api_helper import Api
from integration.ggrc import generator
from integration.ggrc.models import factories


class TestDocument(TestCase):
  """Document test cases"""
  # pylint: disable=invalid-name

  def setUp(self):
    super(TestDocument, self).setUp()
    self.api = Api()
    self.gen = generator.ObjectGenerator()

  def test_update_title(self):
    """Test update document title."""
    create_title = "test_title"
    update_title = "update_test_title"
    document = factories.DocumentFactory(title=create_title)
    response = self.api.put(document, {"title": update_title})
    self.assert200(response)
    self.assertEqual(all_models.Document.query.get(document.id).title,
                     update_title)

  def create_document_by_type(self, doc_type):
    """Create docuemtn with sent type."""
    resp, doc = self.gen.generate_object(
        all_models.Document,
        {
            "document_type": doc_type,
            "title": "test_title",
            "link": "test_link",
        }
    )
    self.assertTrue(
        all_models.Document.query.filter(
            all_models.Document.id == resp.json["document"]['id'],
            all_models.Document.document_type == doc_type,
        ).all()
    )
    return (resp, doc)

  def test_create_url(self):
    """Test create url."""
    self.create_document_by_type(all_models.Document.URL)

  def test_create_evidence(self):
    """Test create evidence."""
    self.create_document_by_type(all_models.Document.ATTACHMENT)
