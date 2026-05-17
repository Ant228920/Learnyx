from decimal import Decimal

from django.core.management.base import BaseCommand
from users.models import Role, StudentLevel, TeacherLevel, User, Student, Manager, Request
from inventory.models import Discipline, Course, PackagePlan, Package

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

        # 5. Тестовий Студент
        student_role = Role.objects.get(name='Student')
        if not User.objects.filter(email='student@test.com').exists():
            st_user = User.objects.create_user(
                username='student@test.com',
                email='student@test.com',
                password='password123',
                first_name='Тест',
                last_name='Студент',
                phone='+380000000001',
                role_obj=student_role,
                is_approved=True,
            )
            Student.objects.create(user=st_user)
            self.stdout.write(self.style.SUCCESS('✅ Тестовий студент створений'))
        else:
            st_user = User.objects.get(email='student@test.com')

        student_obj, _ = Student.objects.get_or_create(user=st_user)

        # Give test student wallet money so they can test top-up UI
        student_obj.money_balance = Decimal('10000.00')
        student_obj.save(update_fields=['money_balance'])

        # 6. Discipline + Course (required for Package purchase to work)
        discipline, _ = Discipline.objects.get_or_create(name='Загальні курси')
        course, _ = Course.objects.get_or_create(
            title='Основний курс',
            defaults={
                'discipline': discipline,
                'description': 'Базовий навчальний курс LearNYX',
                'total_lessons_course': 100,
                'is_active': True,
            }
        )
        self.stdout.write(self.style.SUCCESS('✅ Discipline та Course створені'))

        # 7. PackagePlan records — 8 / 10 / 12 lessons
        plans_data = [
            {'name': 'Стартовий',  'total_lessons': 8,  'price': '2400.00', 'description': 'Базовий пакет для початку навчання',    'is_active': True},
            {'name': 'Стандарт',   'total_lessons': 10, 'price': '2900.00', 'description': 'Найпопулярніший вибір студентів',        'is_active': True},
            {'name': 'Преміум',    'total_lessons': 12, 'price': '3400.00', 'description': 'Максимальний результат за мінімальну ціну', 'is_active': True},
        ]
        for plan_data in plans_data:
            PackagePlan.objects.get_or_create(name=plan_data['name'], defaults=plan_data)
        self.stdout.write(self.style.SUCCESS('✅ PackagePlan записи створені/оновлені (8, 10, 12 уроків)'))

        # 8. Package records for test student with status='available'
        #    These are what GET /packages/?status=available returns and
        #    POST /packages/{id}/purchase/ activates.
        if not Package.objects.filter(student=student_obj, status='available').exists():
            packages_data = [
                {'total_lessons': 8,  'balance': 8,  'final_price': '2400.00', 'discount': '0.00', 'status': 'available'},
                {'total_lessons': 10, 'balance': 10, 'final_price': '2900.00', 'discount': '0.00', 'status': 'available'},
                {'total_lessons': 12, 'balance': 12, 'final_price': '3400.00', 'discount': '0.00', 'status': 'available'},
            ]
            for pkg_data in packages_data:
                Package.objects.create(student=student_obj, course=course, **pkg_data)
            self.stdout.write(self.style.SUCCESS('✅ Package записи для студента створені (8, 10, 12 уроків)'))

        self.stdout.write(self.style.SUCCESS('🎉 База даних успішно просідована!'))