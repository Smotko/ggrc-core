# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

scope = "Workflow"
description = """
  """
permissions = {
    "read": [
        "Workflow",
        "WorkflowPerson",
        "TaskGroup",
        "TaskGroupObject",
        "TaskGroupTask",
        "Cycle",
        "CycleTaskGroup",
        "CycleTaskGroupObject",
        "CycleTaskGroupObjectTask",
        "CycleTaskEntry",
        "UserRole",
        "Context",
        "Document",
        "ObjectFolder",
        "ObjectFile",
    ],
    "create": [
        "WorkflowPerson",
        "CycleTaskEntry",
        "Document",
        "ObjectFolder",
        "ObjectFile",
    ],
    "update": [
        "WorkflowPerson",
        "Cycle",
        "CycleTaskGroup",
        "CycleTaskGroupObject",
        "CycleTaskGroupObjectTask",
        "CycleTaskEntry",
        "Document",
        "ObjectFolder",
        "ObjectFile",
    ],
    "delete": [
        "WorkflowPerson",
        "CycleTaskEntry",
        "Document",
        "ObjectFolder",
        "ObjectFile",
    ],
    "view_object_page": [
        "Workflow",
    ],
}
