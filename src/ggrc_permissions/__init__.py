# Copyright (C) 2016 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

""" GGRC Permissions """

from flask import Blueprint

from ggrc_permissions.models.access_control_list import AccessControlList
from ggrc_permissions.models.access_control_role import AccessControlRole

# pylint: disable=invalid-name
blueprint = Blueprint(
    'ggrc_permissions',
    __name__,
    template_folder='templates',
    static_folder='static',
    static_url_path='/static/ggrc_permissions',
)
