from django.core.management.base import BaseCommand
from users.models import Role, StudentLevel, TeacherLevel, User, Student, Manager, Request

class Command(BaseCommand):
    help = 'Наповнює базу даних стартовими (seed) даними'

    def handle(self, *args, **kwargs):
        self.stdout.write("Починаємо завантаження Seed-даних...")

        # 1. Створюємо базові ролі
        roles = ['Student', 'Teacher', 'Manager']
        for role_name in roles:
            Role.objects.get_or_create(name=role_name)

        # 2. та 3. Нові рівні навчання (Англійська + блоки класів)
        new_levels = [
            'A1', 'A2', 'B1', 'B2', 'C1', 'C2',
            '1-4 клас', '5-11 клас'
        ]
        
        for level in new_levels:
            StudentLevel.objects.get_or_create(name=level)
            TeacherLevel.objects.get_or_create(name=level)
            
        self.stdout.write(self.style.SUCCESS('✅ Рівні (CEFR та 1-4/5-11 класи) успішно створені'))

        # 4. Створюємо Супер-Адміна
        manager_role = Role.objects.get(name='Manager')
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@learnyx.com', 'adminpassword123', role_obj=manager_role)
            self.stdout.write(self.style.SUCCESS('✅ Адмін створений'))

        # 5. Тестовий Студент (прив'яжемо його до нового рівня 5-11 клас)
        student_role = Role.objects.get(name='Student')
        if not User.objects.filter(username='test_student').exists():
            st_user = User.objects.create_user(
                username='test_student', email='student@test.com', password='password123',
                role_obj=student_role, first_name='Іван', last_name='Студент'
            )
            level_5_11 = StudentLevel.objects.get(name='5-11 клас')
            Student.objects.create(user=st_user, level=level_5_11)
            self.stdout.write(self.style.SUCCESS('✅ Тестовий Студент (5-11 клас) створений'))

        # 6. Тестовий Запит
        if not Request.objects.exists():
            Request.objects.create(
                user=User.objects.get(username='test_student'),
                title='Цікавить підготовка до ЗНО з математики (5-11 клас)',
                status='new'
            )
            self.stdout.write(self.style.SUCCESS('✅ Тестовий Запит створений'))

        self.stdout.write(self.style.SUCCESS('🎉 База даних успішно просідована!'))