# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module containing Document model."""

from sqlalchemy import orm

from ggrc import db
from ggrc.fulltext.mixin import Indexed
from ggrc.models.deferred import deferred
from ggrc.models.mixins import Base
from ggrc.models.relationship import Relatable
from ggrc.models.object_owner import Ownable
from ggrc.models.utils import validate_option


class Document(Ownable, Relatable, Base, Indexed, db.Model):
  """Audit model."""
  __tablename__ = 'documents'

  # TODO: inherit from Titled mixin (note: title is nullable here)
  title = deferred(db.Column(db.String), 'Document')
  link = deferred(db.Column(db.String), 'Document')
  description = deferred(db.Column(db.Text), 'Document')
  kind_id = deferred(db.Column(db.Integer), 'Document')
  year_id = deferred(db.Column(db.Integer), 'Document')
  language_id = deferred(db.Column(db.Integer), 'Document')

  URL = 1
  ATTACHMENT = 2
  document_type = deferred(db.Column(db.Integer, default=URL, nullable=False),
                           'Document')

  kind = db.relationship(
      'Option',
      primaryjoin='and_(foreign(Document.kind_id) == Option.id, '
      'Option.role == "reference_type")',
      uselist=False,
  )
  year = db.relationship(
      'Option',
      primaryjoin='and_(foreign(Document.year_id) == Option.id, '
      'Option.role == "document_year")',
      uselist=False,
  )
  language = db.relationship(
      'Option',
      primaryjoin='and_(foreign(Document.language_id) == Option.id, '
      'Option.role == "language")',
      uselist=False,
  )

  _fulltext_attrs = [
      'title',
      'link',
      'description',
  ]

  _publish_attrs = [
      'title',
      'link',
      'description',
      'kind',
      'year',
      'language',
  ]

  _sanitize_html = [
      'title',
      'description',
  ]

  _aliases = {
      'title': "Title",
      'link': "Link",
      'description': "description",
  }

  @orm.validates('kind', 'year', 'language')
  def validate_document_options(self, key, option):
    """Returns correct option, otherwise rises an error"""
    if key == 'year':
      desired_role = 'document_year'
    elif key == 'kind':
      desired_role = 'reference_type'
    else:
      desired_role = key
    return validate_option(self.__class__.__name__, key, option, desired_role)

  @classmethod
  def indexed_query(cls):
    return super(Document, cls).indexed_query().options(
        orm.Load(cls).load_only("title"),
        orm.Load(cls).load_only("link"),
        orm.Load(cls).load_only("description"),
    )

  @classmethod
  def eager_query(cls):
    return super(Document, cls).eager_query().options(
        orm.joinedload('kind'),
        orm.joinedload('year'),
        orm.joinedload('language'),
    )
