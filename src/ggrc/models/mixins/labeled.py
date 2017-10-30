# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Mixin for labeled models."""
from sqlalchemy import orm
from sqlalchemy.ext.declarative import declared_attr

from ggrc import db
from ggrc.models import reflection
from ggrc.models.deferred import deferred


class Labeled(object):
  """Mixin to add label in required model."""

  POSSIBLE_LABELS = []

  _fulltext_attrs = ["label"]
  _api_attrs = reflection.ApiAttributes("label")
  _aliases = {"label": "Label"}

  @declared_attr
  def label(cls):  # pylint: disable=no-self-argument
    return deferred(db.Column(db.Enum(*cls.POSSIBLE_LABELS),
                              nullable=True),
                    cls.__name__)

  @staticmethod
  def _extra_table_args(model):
    return (db.Index('fk_{}_label'.format(model.__tablename__), 'label'), )

  @classmethod
  def indexed_query(cls):
    return super(Labeled, cls).indexed_query().options(
        orm.Load(cls).load_only("label"),
    )
