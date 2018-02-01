# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test automappings"""

from contextlib import contextmanager

import ggrc
from ggrc import models
from ggrc.models import Automapping
from integration.ggrc.models.factories import random_str
from integration.ggrc.automapper.automappings_base import AutomappingsBase


def make_name(msg):
  """Make name helper function"""
  return random_str(prefix=msg)


@contextmanager
def automapping_count_limit(new_limit):
  """Automapping count limit"""
  original_limit = ggrc.automapper.AutomapperGenerator.COUNT_LIMIT
  ggrc.automapper.AutomapperGenerator.COUNT_LIMIT = new_limit
  yield
  ggrc.automapper.AutomapperGenerator.COUNT_LIMIT = original_limit


class TestAutomappings(AutomappingsBase):
  """Test automappings"""

  def test_directive_program_mapping(self):
    """Test mapping directive to a program"""
    self.with_permutations(
        lambda: self.create_object(models.Program, {
            'title': make_name('Program')
        }),
        lambda: self.create_object(models.Regulation, {
            'title': make_name('Test PD Regulation')
        }),
        lambda: self.create_object(models.Objective, {
            'title': make_name('Objective')
        }),
    )
    program = self.create_object(models.Program, {
        'title': make_name('Program')
    })
    objective1 = self.create_object(models.Objective, {
        'title': make_name('Objective')
    })
    objective2 = self.create_object(models.Objective, {
        'title': make_name('Objective')
    })
    self.assert_mapping_implication(
        to_create=[(program, objective1), (objective1, objective2)],
        implied=[],
    )

  def test_mapping_to_sections(self):
    """Test mapping to section"""
    regulation = self.create_object(models.Regulation, {
        'title': make_name('Test Regulation')
    })
    section = self.create_object(models.Section, {
        'title': make_name('Test section'),
    })
    objective = self.create_object(models.Objective, {
        'title': make_name('Objective')
    })
    self.assert_mapping_implication(
        to_create=[(regulation, section), (objective, section)],
        implied=(objective, regulation),

    )
    program = self.create_object(models.Program, {
        'title': make_name('Program')
    })
    self.assert_mapping_implication(
        to_create=[(objective, program)],
        implied=[(regulation, section),
                 (objective, section),
                 (objective, regulation)],
        relevant=[regulation, section, objective]
    )

  def test_automapping_limit(self):
    """Test mapping limit"""
    with automapping_count_limit(-1):
      regulation = self.create_object(models.Regulation, {
          'title': make_name('Test Regulation')
      })
      section = self.create_object(models.Section, {
          'title': make_name('Test section'),
      })
      objective = self.create_object(models.Objective, {
          'title': make_name('Objective')
      })
      self.assert_mapping_implication(
          to_create=[(regulation, section), (objective, section)],
          implied=[],
      )

  def test_mapping_to_objective(self):
    """Test mapping to objective"""
    regulation = self.create_object(models.Regulation, {
        'title': make_name('Test PD Regulation')
    })
    section = self.create_object(models.Section, {
        'title': make_name('Test section'),
        'directive': {'id': regulation.id},
    })
    control = self.create_object(models.Control, {
        'title': make_name('Test control')
    })
    objective = self.create_object(models.Objective, {
        'title': make_name('Test control')
    })
    self.assert_mapping_implication(
        to_create=[(regulation, section),
                   (section, objective),
                   (objective, control)],
        implied=[
            (regulation, objective),
            (section, control),
            (regulation, control),
        ]
    )

    program = self.create_object(models.Program, {
        'title': make_name('Program')
    })
    self.assert_mapping_implication(
        to_create=[(control, program)],
        implied=[
            (regulation, section),
            (section, objective),
            (objective, control),
            (regulation, objective),
            (section, control),
            (regulation, control),
        ],
        relevant=[regulation, section, objective, control]
    )

  def test_mapping_between_objectives(self):
    """Test mapping between objectives"""
    regulation = self.create_object(models.Regulation, {
        'title': make_name('Test PD Regulation')
    })
    section = self.create_object(models.Section, {
        'title': make_name('Test section'),
        'directive': {'id': regulation.id},
    })
    objective1 = self.create_object(models.Objective, {
        'title': make_name('Test Objective')
    })
    objective2 = self.create_object(models.Objective, {
        'title': make_name('Test Objective')
    })
    self.assert_mapping_implication(
        to_create=[(regulation, section),
                   (section, objective1),
                   (objective1, objective2)],
        implied=[
            (section, objective2),
            (regulation, objective1),
            (regulation, objective2),
        ]
    )

  def test_mapping_nested_controls(self):
    """Test mapping of nested controls"""
    objective = self.create_object(models.Objective, {
        'title': make_name('Test Objective')
    })
    control_p = self.create_object(models.Control, {
        'title': make_name('Test control')
    })
    control1 = self.create_object(models.Control, {
        'title': make_name('Test control')
    })
    control2 = self.create_object(models.Control, {
        'title': make_name('Test control')
    })
    self.assert_mapping_implication(
        to_create=[(objective, control_p),
                   (control_p, control1),
                   (control_p, control2)],
        implied=[(objective, control1), (objective, control2)]
    )

  def test_automapping_permissions(self):
    """Test automapping permissions"""
    _, creator = self.gen.generate_person(user_role="Creator")
    _, admin = self.gen.generate_person(user_role="Administrator")
    program = self.create_object(models.Program, {
        'title': make_name('Program')
    })
    program = program.query.get(program.id)

    regulation = self.create_object(models.Regulation, {
        'title': make_name('Regulation'),
    })
    self.create_ac_roles(regulation, admin.id)
    regulation = regulation.query.get(regulation.id)

    self.api.set_user(creator)
    section = self.create_object(models.Section, {
        'title': make_name('Section'),
    })
    self.create_ac_roles(section, creator.id)
    section = section.query.get(section.id)

    objective = self.create_object(models.Objective, {
        'title': make_name('Objective'),
    })
    self.create_ac_roles(objective, creator.id)
    objective = objective.query.get(objective.id)

    control = self.create_object(models.Control, {
        'title': make_name('Control'),
    })
    self.create_ac_roles(control, creator.id)
    control = control.query.get(control.id)

    self.api.set_user(admin)
    self.assert_mapping_implication(
        to_create=[(program, regulation), (regulation, section)],
        implied=[(program, section)]
    )

    self.api.set_user(creator)
    self.assert_mapping_implication(
        to_create=[(section, objective),
                   (control, objective)],
        implied=[(program, regulation),
                 (program, section),
                 (section, regulation),
                 (control, section)],
    )

  def test_automapping_deletion(self):
    """Test if automapping data is preserved even when the parent relationship
       is deleted.
    """
    # Prepare some data:
    program = self.create_object(models.Program, {
        'title': make_name('Program')
    })
    regulation = self.create_object(models.Regulation, {
        'title': make_name('Regulation')
    })
    control = self.create_object(models.Control, {
        'title': make_name('Control')
    })
    self.create_mapping(program, regulation)
    rel1 = self.create_mapping(regulation, control)

    # Check if the correct automapping row is inserted:
    auto = Automapping.query.filter_by(
        source_id=rel1.source_id,
        source_type=rel1.source_type,
        destination_id=rel1.destination_id,
        destination_type=rel1.destination_type
    ).one()
    assert auto is not None

    # Check if the correct parent id is set:
    rel2 = models.Relationship.query.filter_by(
        parent_id=rel1.id
    ).one()
    assert rel2 is not None

    # Check if the new relationship points to the correct automapping
    assert rel2.automapping_id == auto.id

    # Delete the parent relationship
    self.api.delete(rel1)

    # Use the automapping_id to find the relationship again
    rel2_after_delete = models.Relationship.query.filter_by(
        automapping_id=auto.id
    ).one()

    assert rel2_after_delete is not None
    # Make sure we are looking at the same object
    assert rel2.id == rel2_after_delete.id
    # Parent id should now be None
    assert rel2_after_delete.parent_id is None
