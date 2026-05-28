from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models import CheckConstraint, Q, Count

# Рівні навчання (студенти та викладачі)
class StudentLevel(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

class TeacherLevel(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

class User(AbstractUser):
    email = models.EmailField(unique=True)
    role_obj = models.ForeignKey(Role, on_delete=models.PROTECT, null=True, blank=True, related_name='users')

    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)

    father_name = models.CharField(max_length=50, blank=True, null=True)
    phone = models.CharField(max_length=20, unique=True, blank=True, null=True)
    nickname = models.CharField(max_length=50, unique=True, blank=True, null=True)
    photo = models.CharField(max_length=255, blank=True, null=True)
    is_approved = models.BooleanField(default=False)

    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_set',
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_permissions_set',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )

    class Meta:
        indexes = [
            # Оптимізація: швидкий пошук користувачів в адмінці або при авторизації
            models.Index(fields=['email']),
            models.Index(fields=['phone']),
            # Оптимізація: швидка фільтрація непідтверджених акаунтів (is_approved=False)
            models.Index(fields=['is_approved']),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"


# --- COMPLEX QUERIES MANAGERS ---
class StudentQuerySet(models.QuerySet):
    def with_details(self):
        # [COMPLEX QUERY: JOINS]
        return self.select_related('user', 'level')

    def with_analytics(self):
        # [COMPLEX QUERY: JOINS + AGGREGATIONS]
        return self.annotate(
            total_requests=Count('user__requests', distinct=True),
            total_reviews=Count('user__reviews', distinct=True)
        ).select_related('user')

class ManagerQuerySet(models.QuerySet):
    def with_analytics(self):
        # [COMPLEX QUERY: JOINS + AGGREGATIONS]
        return self.annotate(
            total_assigned_requests=Count('assigned_requests'),
            resolved_requests=Count('assigned_requests', filter=Q(assigned_requests__status='resolved'))
        ).select_related('user')


# Студент, Менеджер
class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, related_name='student_profile')
    level = models.ForeignKey(StudentLevel, on_delete=models.SET_NULL, null=True, related_name='students')
    money_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    objects = StudentQuerySet.as_manager()

    class Meta:
        constraints = [
            # Data Integrity: Грошовий баланс студента ніколи не може бути від'ємним!
            CheckConstraint(
                condition=Q(money_balance__gte=0),
                name='check_positive_money_balance'
            )
        ]

    def __str__(self):
        return f"Студент: {self.user.first_name} {self.user.last_name}"

class Manager(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, related_name='manager_profile')
    is_active = models.BooleanField(default=True)

    objects = ManagerQuerySet.as_manager()

    class Meta:
        indexes = [
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"Менеджер: {self.user.first_name}"


# --- COMPLEX QUERIES MANAGERS ---
class RequestQuerySet(models.QuerySet):
    def with_users(self):
        # [COMPLEX QUERY: JOINS]
        return self.select_related('user', 'manager__user')

class Request(models.Model):
    # Згідно з ТЗ: Переведення статусів на TextChoices замість звичайного тексту
    class Status(models.TextChoices):
        NEW = 'new', 'New'
        IN_PROGRESS = 'in_progress', 'In Progress'
        RESOLVED = 'resolved', 'Resolved'
        REJECTED = 'rejected', 'Rejected'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requests')
    manager = models.ForeignKey(Manager, on_delete=models.SET_NULL, null=True, related_name='assigned_requests')
    title = models.TextField()
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.NEW)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = RequestQuerySet.as_manager()

    class Meta:
        indexes = [
            # Оптимізація: швидкий пошук заявок за статусом та датою
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['manager', 'status']),
        ]

    def __str__(self):
        return f"Заявка #{self.id} від {self.user.email} ({self.get_status_display()})"

class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_visible = models.BooleanField(default=True)

    class Meta:
        indexes = [
            # Оптимізація: швидке виведення останніх відгуків на сайті
            models.Index(fields=['created_at']),
        ]
        constraints = [
            # Data Integrity: Відгук не може бути порожнім рядком
            CheckConstraint(
                condition=~Q(text=''),
                name='check_review_text_not_empty'
            )
        ]

    def __str__(self):
        return f"Відгук від {self.user.first_name} ({self.created_at.strftime('%Y-%m-%d')})"