# Copyright (C) 2016 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Integration tests for WithSimilarityScore logic."""

import json

from ggrc.models import Assessment
import integration.ggrc
from integration.ggrc.models import factories


# pylint: disable=super-on-old-class; TestCase is a new-style class
class TestWithSimilarityScore(integration.ggrc.TestCase):
  """Integration test suite for WithSimilarityScore functionality."""

  def setUp(self):
    super(TestWithSimilarityScore, self).setUp()
    self.client.get("/login")

    self.assessment = factories.AssessmentFactory()
    self.audit = factories.AuditFactory()
    self.control = factories.ControlFactory()
    self.regulation = factories.RegulationFactory()

    self.make_relationships(
        self.assessment, (
            self.audit,
            self.control,
            self.regulation,
        ),
    )

    self.other_assessments, self.id_weight_map = self.make_assessments()

  @staticmethod
  def make_relationships(source, destinations):
    for destination in destinations:
      factories.RelationshipFactory(
          source=source,
          destination=destination,
      )

  def make_assessments(self):
    """Create six assessments and map them to audit, control, regulation.

    Each of the created assessments is mapped to its own subset of {audit,
    control, regulation} so each of them has different similarity weight.

    Returns: the six generated assessments and their weights in a dict.
    """

    assessment_mappings = (
        (self.audit,),
        (self.control,),
        (self.regulation,),
        (self.audit, self.control),
        (self.audit, self.regulation),
        (self.control, self.regulation),
        (self.audit, self.control, self.regulation),
    )
    weights = (5, 10, 3, 15, 8, 13, 18)

    assessments = [factories.AssessmentFactory()
                   for _ in range(len(assessment_mappings))]
    for assessment, mappings in zip(assessments, assessment_mappings):
      self.make_relationships(assessment, mappings)

    id_weight_map = {assessment.id: weight
                     for assessment, weight in zip(assessments, weights)}

    return assessments, id_weight_map

  def test_get_similar_objects_weights(self):  # pylint: disable=invalid-name
    """Check weights counted for similar objects."""
    similar_objects = Assessment.get_similar_objects_query(
        id_=self.assessment.id,
        types=["Assessment"],
        threshold=0,  # to include low weights too
    ).all()

    # casting to int from Decimal to prettify the assertion method output
    id_weight_map = {obj.id: int(obj.weight) for obj in similar_objects}

    self.assertDictEqual(id_weight_map, self.id_weight_map)

  def test_get_similar_objects(self):
    """Check similar objects manually and via Query API."""
    similar_objects = Assessment.get_similar_objects_query(
        id_=self.assessment.id,
        types=["Assessment"],
    ).all()
    expected_ids = {id_ for id_, weight in self.id_weight_map.items()
                    if weight >= Assessment.similarity_options["threshold"]}

    self.assertSetEqual(
        {obj.id for obj in similar_objects},
        expected_ids,
    )

    query = [{
        "object_name": "Assessment",
        "type": "ids",
        "filters": {
            "expression": {
                "op": {"name": "similar"},
                "object_name": "Assessment",
                "ids": [str(self.assessment.id)],
            },
        },
    }]
    response = self.client.post(
        "/query",
        data=json.dumps(query),
        headers={"Content-Type": "application/json"},
    )
    self.assertSetEqual(
        set(json.loads(response.data)[0]["Assessment"]["ids"]),
        expected_ids,
    )

  def test_sort_by_similarity(self):
    """Check sorting by __similarity__ value with query API."""
    expected_ids = [id_ for id_, weight in sorted(self.id_weight_map.items(),
                                                  key=lambda item: item[1])
                    if weight >= Assessment.similarity_options["threshold"]]

    query = [{
        "object_name": "Assessment",
        "type": "ids",
        "order_by": [{"name": "__similarity__"}],
        "filters": {
            "expression": {
                "op": {"name": "similar"},
                "object_name": "Assessment",
                "ids": [str(self.assessment.id)],
            },
        },
    }]
    response = self.client.post(
        "/query",
        data=json.dumps(query),
        headers={"Content-Type": "application/json"},
    )

    # note that in our test data every similar object has a different weight;
    # the order of objects with same weight is undefined after sorting
    self.assertListEqual(
        json.loads(response.data)[0]["Assessment"]["ids"],
        expected_ids,
    )
