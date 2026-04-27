from django.db import models
from users.models import User, TeacherLevel, Student, Manager # Імпортуємо зв'язки

class Discipline(models.Model):
    name = models.CharField(max_length=100, unique=True)
    def __str__(self): return self.name

class Teacher(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    discipline = models.ForeignKey(Discipline, on_delete=models.SET_NULL, null=True)
    level = models.ForeignKey(TeacherLevel, on_delete=models.SET_NULL, null=True)
    bio = models.TextField(blank=True, null=True)
    salary = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

class Slot(models.Model):
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    
    # ... твоє поле status з попереднього кроку ...
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('booked', 'Booked'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')

    # ДОДАЄМО ЦЕ ДЛЯ ВИКОНАННЯ ЗАВДАННЯ:
    class Meta:
        indexes = [
            # Вказуємо поля для композитного індексу (вчитель + дата)
            models.Index(fields=['teacher', 'start_time']),
        ]
class Course(models.Model):
    discipline = models.ForeignKey(Discipline, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    total_lessons_course = models.IntegerField()
    is_active = models.BooleanField(default=True)

class Topic(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    level_topics = models.CharField(max_length=50, blank=True, null=True)
    order_index = models.IntegerField()

class CurriculumLesson(models.Model):
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    theory_material_url = models.CharField(max_length=255, blank=True, null=True)
    default_homework = models.TextField(blank=True, null=True)
    order_index = models.IntegerField()

class CourseCompletion(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    completed_lessons_count = models.IntegerField(default=0)
    total_points = models.IntegerField(default=0)
    earned_discount = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    is_discount_used = models.BooleanField(default=False)
    completed_at = models.DateTimeField(blank=True, null=True)

class Package(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    discipline = models.ForeignKey(Discipline, on_delete=models.SET_NULL, null=True)
    completed = models.ForeignKey(CourseCompletion, on_delete=models.SET_NULL, null=True)
    total_lessons = models.IntegerField()
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    final_price = models.DecimalField(max_digits=10, decimal_places=2)
    balance = models.IntegerField()
    status = models.CharField(max_length=50, default='active')
    purchased_at = models.DateTimeField(auto_now_add=True)

class Lesson(models.Model):
    # Тут все залишається без змін, ключі slot_id та student_id створяться автоматично
    slot = models.OneToOneField(Slot, on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    
    package = models.ForeignKey(Package, on_delete=models.CASCADE)
    curriculum_lesson = models.ForeignKey(CurriculumLesson, on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=50, default='scheduled')
    meeting_link = models.CharField(max_length=255, blank=True, null=True)
class JournalRecord(models.Model):
    lesson = models.OneToOneField(Lesson, on_delete=models.CASCADE)
    is_present = models.BooleanField(default=True)
    teacher_homework_task = models.TextField(blank=True, null=True)
    homework_answer_url = models.CharField(max_length=255, blank=True, null=True)
    homework_grade = models.IntegerField(blank=True, null=True)
    activity_grade = models.IntegerField(blank=True, null=True)
    teacher_notes = models.TextField(blank=True, null=True)

class Transaction(models.Model):
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    lesson = models.ForeignKey(Lesson, on_delete=models.SET_NULL, null=True)
    title = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_penalty = models.BooleanField(default=False)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)