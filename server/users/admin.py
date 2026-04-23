from django.contrib import admin
from .models import User, Student, Manager, Role, StudentLevel, TeacherLevel, Request, Review

admin.site.register([User, Student, Manager, Role, StudentLevel, TeacherLevel, Request, Review])