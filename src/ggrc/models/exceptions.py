# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Model-related exceptions and related logic."""

import re
from sqlalchemy.exc import IntegrityError


def field_lookup(field_string):
  """Find relevant error field for UNIQUE violation in SQL error message."""
  bad_field = 'code'  # assumes this field as a default
  if field_string.startswith('uq_t_'):
    bad_field = 'title'
  elif field_string.endswith('email'):
    bad_field = 'email'
  elif field_string.endswith('title'):
    bad_field = 'title'
  return bad_field


def translate_message(exception):
  """
  Translates db exceptions to something a user can understand.
  """
  message = exception.message

  if isinstance(exception, IntegrityError):
    # TODO: Handle not null, foreign key, uniqueness errors with compound keys
    code, exc_message = exception.orig.args
    if code == 1062:  # duplicate entry ... for key ...
      pattern = re.compile(r"Duplicate entry ('.*') for key '(.*)'")
      matches = pattern.search(message)
      if matches:
        return (u"The value {value} is already used for another {key}. "
                u"{key} values must be unique."
                .format(value=matches.group(1),
                        key=field_lookup(matches.group(2))))

  return message


class ValidationError(Exception):
  pass
