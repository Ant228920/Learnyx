from django.contrib import admin
from .models import Discipline, Teacher, Slot, Course, Topic, CurriculumLesson, CourseCompletion, Package, Lesson, JournalRecord, Transaction

admin.site.register([Discipline, Teacher, Slot, Course, Topic, CurriculumLesson, CourseCompletion, Package, Lesson, JournalRecord, Transaction])