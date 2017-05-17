# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

scope = "Audit Implied"
description = """
  A user with the ProgramEditor role for a private program will also have this
  role in the audit context for any audit created for that program.
  """
permissions = {
    "read": [
        "Comment",
        "Assessment",
        "AssessmentTemplate",
        "Issue",
        "Audit",
        "Snapshot",
        "AuditObject",
        "Meeting",
        "ObjectControl",
        "ObjectPerson",
        "Relationship",
        "Document",
        "Meeting",
        "UserRole",
        "Context",
    ],
    "create": [
        "Snapshot",
        "Comment",
        "Assessment",
        "AssessmentTemplate",
        "Issue",
        "Meeting",
        "ObjectControl",
        "ObjectPerson",
        "Relationship",
        "Document",
        "Meeting",
        "AuditObject"
    ],
    "view_object_page": [
        "__GGRC_ALL__"
    ],
    "update": [
        "Assessment",
        "AssessmentTemplate",
        "Issue",
        "Snapshot",
        "Audit",
        "AuditObject",
        "Meeting",
        "ObjectControl",
        "ObjectPerson",
        "Relationship",
        "Document",
        "Meeting"
    ],
    "delete": [
        "AssessmentTemplate",
        "ObjectControl",
        "ObjectPerson",
        "Relationship",
        "Document",
        "Meeting",
        "Audit",
        "AuditObject"
    ]
}
