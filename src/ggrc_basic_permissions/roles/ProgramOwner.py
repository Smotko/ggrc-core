# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

scope = "Private Program"
description = """
  User with authorization to peform administrative tasks such as associating
  users to roles within the scope of of a program.<br/><br/>When a person
  creates a program they are automatically given the ProgramOwner role. This
  allows them to Edit, Delete, or Map objects to the Program. It also allows
  them to add people and assign them roles when their programs are private.
  ProgramOwner is the most powerful role.
  """
permissions = {
    "read": [
        "Document",
        "ObjectPerson",
        "Program",
        "ProgramControl",
        "Relationship",
        "UserRole",
        "Context",
    ],
    "create": [
        "Document",
        "ObjectPerson",
        "ProgramControl",
        "Relationship",
        "UserRole",
        "Audit",
        "Snapshot",
    ],
    "view_object_page": [
        "__GGRC_ALL__"
    ],
    "update": [
        "Document",
        "ObjectPerson",
        "Program",
        "ProgramControl",
        "Relationship",
        "UserRole"
    ],
    "delete": [
        "Document",
        "ObjectPerson",
        "Program",
        "ProgramControl",
        "Relationship",
        "UserRole",
    ]
}
