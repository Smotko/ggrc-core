# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

scope = "Private Program"
description = """
  A user with authorization to read mapping objects related to an access
  controlled Program.<br/><br/>This is essentially a view only role. A person
  with this role can access and view an otherwise private program, but they
  cannot map to or edit that program in any way.
  """
permissions = {
    "read": [
        "Document",
        "ObjectObjective",
        "ObjectPerson",
        "ObjectSection",
        "Program",
        "ProgramDirective",
        "Relationship",
        "UserRole",
        "Context",
    ],
    "create": [],
    "view_object_page": [
        "__GGRC_ALL__"
    ],
    "update": [],
    "delete": []
}
