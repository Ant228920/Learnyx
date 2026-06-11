"""
Seed — базові довідники та адмін.
Usage: python manage.py seed
"""
from django.core.management.base import BaseCommand
from inventory.models import Course, Discipline, PackagePlan
from users.models import Role, StudentLevel, TeacherLevel, User


class Command(BaseCommand):
    help = 'Seed database with base reference data and admin account'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("Починаємо завантаження Seed-даних..."))

        # 1. Базові ролі
        roles_objs = {}
        for role_name in ['Student', 'Teacher', 'Manager', 'Admin']:
            role, _ = Role.objects.get_or_create(name=role_name)
            roles_objs[role_name] = role
        self.stdout.write(self.style.SUCCESS('Ролі створені'))

        # 2. Дисципліни
        disciplines_data = ['Загальні курси', 'Англійська мова', 'Математика', 'Українська мова', 'Програмування']
        for d_name in disciplines_data:
            Discipline.objects.get_or_create(name=d_name)
        self.stdout.write(self.style.SUCCESS('Дисципліни створені'))

        # Базовий курс — потрібен для Package.course (NOT NULL FK)
        disc_zagalni = Discipline.objects.filter(name='Загальні курси').first()
        Course.objects.get_or_create(
            title='Загальний курс',
            defaults={
                'discipline': disc_zagalni,
                'description': 'Базовий курс для всіх студентів платформи',
                'total_lessons_course': 200,
                'is_active': True,
            }
        )
        self.stdout.write(self.style.SUCCESS('Базовий курс створений'))

        # 3. Рівні навчання
        all_levels = [
            'A1-B1 рівень', 'B2-C2 рівень',
            '1-4 клас', '5-11 клас', 'Дошкільнята',
            'Підготовка до НМТ/ЗНО', 'Дорослі (Business)',
            'A1-B1', 'B1-B2', 'B2-C1', 'С1-С2',
        ]
        for level in all_levels:
            StudentLevel.objects.update_or_create(name__iexact=level, defaults={'name': level})
            TeacherLevel.objects.update_or_create(name__iexact=level, defaults={'name': level})
        self.stdout.write(self.style.SUCCESS('Рівні-довідники створені та оновлені'))

        # 4. Адмін
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                'admin', 'admin@learnyx.com', 'adminpassword123',
                role_obj=roles_objs['Admin'],
                is_approved=True,
            )
            self.stdout.write(self.style.SUCCESS('Адмін створений'))
        else:
            self.stdout.write(self.style.SUCCESS('Адмін вже існує (пропущено)'))

        # 5. Пакетні плани
        plans_data = [
            {'name': 'Пробний',   'total_lessons': 1,  'price': '300.00',  'description': 'Одне заняття для знайомства з платформою',    'is_active': True},
            {'name': 'Стартовий', 'total_lessons': 8,  'price': '2400.00', 'description': 'Базовий пакет для початку навчання',           'is_active': True},
            {'name': 'Стандарт',  'total_lessons': 10, 'price': '2900.00', 'description': 'Найпопулярніший вибір студентів',              'is_active': True},
            {'name': 'Преміум',   'total_lessons': 12, 'price': '3400.00', 'description': 'Максимальний результат за мінімальну ціну',    'is_active': True},
            {'name': 'Інтенсив',  'total_lessons': 24, 'price': '6400.00', 'description': 'Великий пакет для максимального занурення',    'is_active': True},
        ]
        for plan_data in plans_data:
            PackagePlan.objects.get_or_create(name=plan_data['name'], defaults=plan_data)
        self.stdout.write(self.style.SUCCESS('Пакетні плани створені'))

        self.stdout.write(self.style.SUCCESS('База даних успішно просідована!'))
