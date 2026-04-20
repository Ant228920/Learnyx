from django.db import models
from django.contrib.auth.models import AbstractUser

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

# Головний користувач (повна відповідність твоєму SQL)
class User(AbstractUser):
    role_obj = models.ForeignKey(Role, on_delete=models.PROTECT, null=True, blank=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    father_name = models.CharField(max_length=50, blank=True, null=True)
    phone = models.CharField(max_length=20, unique=True, blank=True, null=True)
    nickname = models.CharField(max_length=50, unique=True, blank=True, null=True)
    photo = models.CharField(max_length=255, blank=True, null=True)
    is_approved = models.BooleanField(default=False)

    # --- ВИПРАВЛЕННЯ КОНФЛІКТУ (E304) ---
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

# Студент, Викладач, Менеджер
class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    level = models.ForeignKey(StudentLevel, on_delete=models.SET_NULL, null=True)

class Manager(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    is_active = models.BooleanField(default=True)

# Запити та відгуки
class Request(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    manager = models.ForeignKey(Manager, on_delete=models.SET_NULL, null=True)
    title = models.TextField()
    status = models.CharField(max_length=50, default='new')
    created_at = models.DateTimeField(auto_now_add=True)

class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)