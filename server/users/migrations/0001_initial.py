from django.contrib.auth.models import AbstractUser
from django.db import models

# ─── Допоміжні моделі (Рівні та Ролі) ─────────────────────────────────

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

# ─── Головний користувач ──────────────────────────────────────────────

class User(AbstractUser):
    role_obj = models.ForeignKey(Role, on_delete=models.PROTECT, null=True, blank=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    father_name = models.CharField(max_length=50, blank=True, null=True)
    phone = models.CharField(max_length=20, unique=True, blank=True, null=True)
    nickname = models.CharField(max_length=50, unique=True, blank=True, null=True)
    photo = models.CharField(max_length=255, blank=True, null=True)
    is_approved = models.BooleanField(default=False)

    # Виправлення конфліктів імен із вбудованим User
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_set',
        blank=True,
        verbose_name='groups',
        help_text='The groups this user belongs to.',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_permissions_set',
        blank=True,
        verbose_name='user permissions',
        help_text='Specific permissions for this user.',
    )

    def __str__(self):
        return self.email if self.email else self.username

# ─── Профілі (Студент, Менеджер) ──────────────────────────────────────

class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    level = models.ForeignKey(StudentLevel, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"Student: {self.user.email}"

class Manager(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Manager: {self.user.email}"

# ─── Взаємодія (Запити, Відгуки) ──────────────────────────────────────

class Request(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    manager = models.ForeignKey(Manager, on_delete=models.SET_NULL, null=True)
    title = models.TextField()
    status = models.CharField(max_length=50, default='new')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Request {self.id} from {self.user.email}"

class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review from {self.user.email}"