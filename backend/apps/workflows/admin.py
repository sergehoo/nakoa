from django.contrib import admin
from .models import Workflow, WorkflowExecution

admin.site.register(Workflow)
admin.site.register(WorkflowExecution)
