# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Automappings base"""

import itertools

import ggrc
from ggrc import automapper
from ggrc import models
from integration.ggrc import TestCase
from integration.ggrc import generator
from integration.ggrc.models import factories


class AutomappingsBase(TestCase):
  """Automappings Base

  Includes helpful methods used by multiple automapping test case classes"""
  def setUp(self):
    super(AutomappingsBase, self).setUp()
    self.gen = generator.ObjectGenerator()
    self.api = self.gen.api

  @classmethod
  def create_ac_roles(cls, obj, person_id):
    """Create access control roles"""
    ac_role = models.AccessControlRole.query.filter_by(
        object_type=obj.type,
        name="Admin"
    ).first()
    factories.AccessControlListFactory(
        ac_role=ac_role,
        object=obj,
        person_id=person_id
    )

  def create_object(self, cls, data):
    """Helper function for creating an object"""
    name = cls._inflector.table_singular
    data['context'] = None
    res, obj = self.gen.generate(cls, name, {name: data})
    self.assertIsNotNone(obj, '%s, %s: %s' % (name, str(data), str(res)))
    return obj

  def create_mapping(self, src, dst):
    """Helper function for creating mappings"""
    return self.gen.generate_relationship(src, dst)[1]

  def assert_mapping(self, obj1, obj2, missing=False):
    """Helper function for asserting mappings"""
    ggrc.db.session.flush()
    rel = models.Relationship.find_related(obj1, obj2)
    if not missing:
      self.assertIsNotNone(rel,
                           msg='%s not mapped to %s' % (obj1.type, obj2.type))
      revisions = models.Revision.query.filter_by(
          resource_type='Relationship',
          resource_id=rel.id,
      ).count()
      self.assertEqual(revisions, 1)
    else:
      self.assertIsNone(rel,
                        msg='%s mapped to %s' % (obj1.type, obj2.type))

  def assert_mapping_implication(self, to_create, implied, relevant=None):
    """Helper function for asserting mapping implication"""
    if relevant is None:
      relevant = set()
    objects = set()
    for obj in relevant:
      objects.add(obj)
    mappings = set()
    if not isinstance(to_create, list):
      to_create = [to_create]
    for src, dst in to_create:
      objects.add(src)
      objects.add(dst)
      self.create_mapping(src, dst)
      mappings.add(automapper.AutomapperGenerator.order(src, dst))
    if not isinstance(implied, list):
      implied = [implied]
    for src, dst in implied:
      objects.add(src)
      objects.add(dst)
      self.assert_mapping(src, dst)
      mappings.add(automapper.AutomapperGenerator.order(src, dst))
    possible = set()
    for src, dst in itertools.product(objects, objects):
      possible.add(automapper.AutomapperGenerator.order(src, dst))
    for src, dst in possible - mappings:
      self.assert_mapping(src, dst, missing=True)

  def with_permutations(self, mk1, mk2, mk3):
    """Helper function for creating permutations"""
    obj1, obj2, obj3 = mk1(), mk2(), mk3()
    self.assert_mapping_implication(
        to_create=[(obj1, obj2), (obj2, obj3)],
        implied=(obj1, obj3),
    )
    obj1, obj2, obj3 = mk1(), mk2(), mk3()
    self.assert_mapping_implication(
        to_create=[(obj2, obj3), (obj1, obj2)],
        implied=(obj1, obj3),
    )
