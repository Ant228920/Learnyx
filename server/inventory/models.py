from django.db import models
from django.db.models import CheckConstraint, Q, F, Count, Sum, Avg
from users.models import User, TeacherLevel, Student, Manager
from django.core.validators import MaxValueValidator, MinValueValidator

class Discipline(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self): 
        return self.name

class Teacher(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, related_name='teacher_profile')
    discipline = models.ForeignKey(Discipline, on_delete=models.SET_NULL, null=True, related_name='teachers')
    level = models.ForeignKey(TeacherLevel, on_delete=models.SET_NULL, null=True)
    bio = models.TextField(blank=True, null=True)
    salary = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

class Slot(models.Model):
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='slots')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('booked', 'Booked'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')

    class Meta:
        indexes = [
            # Оптимізація: швидкий пошук вільних слотів конкретного вчителя
            models.Index(fields=['teacher', 'start_time', 'status']),
        ]
        constraints = [
            # DATA INTEGRITY: Час закінчення слоту фізично не може бути меншим або дорівнювати часу початку
            CheckConstraint(
                condition=Q(end_time__gt=F('start_time')),
                name='check_valid_slot_time_range'
            )
        ]

class Course(models.Model):
    discipline = models.ForeignKey(Discipline, on_delete=models.CASCADE, related_name='courses')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    total_lessons_course = models.IntegerField()
    is_active = models.BooleanField(default=True)

    discount_milestones = models.JSONField(
        blank=True, null=True, default=dict,
        help_text='Логіка: {"85": 5, "91": 10, "96": 15}. Ключ — мінімальний бал для отримання відсотка знижки.'
    )

    class Meta:
        indexes = [
            models.Index(fields=['is_active', 'discipline']),
        ]

    def __str__(self):
        return self.title

class Topic(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='topics')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    level_topics = models.CharField(max_length=50, blank=True, null=True)
    order_index = models.IntegerField()

class CurriculumLesson(models.Model):
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='curriculum_lessons')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    theory_material_url = models.CharField(max_length=255, blank=True, null=True)
    default_homework = models.TextField(blank=True, null=True)
    order_index = models.IntegerField()


# --- COMPLEX QUERIES MANAGERS ---
# Реалізація вимоги "Складні запити (Join, Aggregation)" на рівні моделей
class CourseCompletionQuerySet(models.QuerySet):
    def with_student_details(self):
        # Оптимізація JOIN: підтягує дані студента та курсу одним SQL-запитом
        return self.select_related('student', 'course')

    def aggregate_points(self):
        # Агрегація: розрахунок загальної кількості набраних балів усіма учнями
        return self.aggregate(total_system_points=Sum('total_points'))

class CourseCompletion(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='completions')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='completions')
    completed_lessons_count = models.IntegerField(default=0)
    total_points = models.IntegerField(default=0)
    
    earned_discount = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    is_discount_used = models.BooleanField(
        default=False,
        help_text="True, якщо бонуси за цей курс уже були використані для оплати пакета"
    )
    completed_at = models.DateTimeField(blank=True, null=True)

    # Підключаємо кастомний менеджер складних запитів
    objects = CourseCompletionQuerySet.as_manager()

    class Meta:
        indexes = [
            models.Index(fields=['student', 'is_discount_used']),
        ]
        constraints = [
            CheckConstraint(
                condition=Q(earned_discount__gte=0) & Q(earned_discount__lte=100), 
                name='check_valid_earned_discount'
            ),
            CheckConstraint(
                condition=Q(completed_lessons_count__gte=0),
                name='check_positive_completed_lessons'
            )
        ]

    def __str__(self):
        status = "Використано" if self.is_discount_used else "Доступно"
        return f"{self.student} - {self.course}: {self.earned_discount}% ({status})"


class Package(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='packages')
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    discipline = models.ForeignKey(Discipline, on_delete=models.SET_NULL, null=True)
    completed = models.ForeignKey(CourseCompletion, on_delete=models.SET_NULL, null=True)
    total_lessons = models.IntegerField()
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    final_price = models.DecimalField(max_digits=10, decimal_places=2)
    balance = models.IntegerField()
    status = models.CharField(max_length=50, default='active')
    purchased_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['student', 'status']),
        ]
        constraints = [
            CheckConstraint(condition=Q(balance__gte=0), name='check_positive_package_balance')
        ]

class LessonQuerySet(models.QuerySet):
    def with_full_relations(self):
        # Complex Join: глибока оптимізація запиту до БД для відображення уроку
        return self.select_related('student', 'slot__teacher', 'package', 'curriculum_lesson')

class Lesson(models.Model):
    class Status(models.TextChoices):
        SCHEDULED = 'scheduled', 'Scheduled'
        CONDUCTED = 'conducted', 'Conducted'
        STUDENT_MISSED = 'student_missed', 'Student Missed'
        TEACHER_MISSED = 'teacher_missed', 'Teacher Missed'
        CANCELED_ADVANCE = 'canceled_advance', 'Canceled in Advance'

    slot = models.OneToOneField(Slot, on_delete=models.CASCADE, related_name='lesson')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='lessons')
    package = models.ForeignKey(Package, on_delete=models.CASCADE, related_name='lessons')
    curriculum_lesson = models.ForeignKey(CurriculumLesson, on_delete=models.SET_NULL, null=True)
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED)
    meeting_link = models.CharField(max_length=255, blank=True, null=True)

    objects = LessonQuerySet.as_manager()

    class Meta:
        indexes = [
            models.Index(fields=['student', 'status']),
        ]

class JournalRecord(models.Model):
    lesson = models.OneToOneField(Lesson, on_delete=models.CASCADE, related_name='journal')
    is_present = models.BooleanField(default=True)
    
    teacher_homework_task = models.JSONField(blank=True, null=True, default=dict)
    homework_answer_url = models.CharField(max_length=255, blank=True, null=True)
    
    grade = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        blank=True, null=True
    )
    
    homework_grade = models.IntegerField(blank=True, null=True)
    activity_grade = models.IntegerField(blank=True, null=True)
    teacher_notes = models.TextField(blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=['is_present']),
        ]
        constraints = [
            CheckConstraint(
                condition=Q(grade__isnull=True) | (Q(grade__gte=1) & Q(grade__lte=10)), 
                name='check_valid_grade_range'
            )
        ]

class Transaction(models.Model):
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='transactions')
    lesson = models.ForeignKey(Lesson, on_delete=models.SET_NULL, null=True)
    title = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_penalty = models.BooleanField(default=False)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            # DB Optimization: Транзакції часто шукають за вчителем та датою
            models.Index(fields=['teacher', 'created_at']),
        ]
        constraints = [
            # Data Integrity: Сума не може бути від'ємною (штрафи позначаються булевим полем is_penalty)
            CheckConstraint(condition=Q(amount__gte=0), name='check_positive_transaction_amount')
        ]