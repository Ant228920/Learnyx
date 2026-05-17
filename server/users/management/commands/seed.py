from django.core.management.base import BaseCommand
from users.models import Role, StudentLevel, TeacherLevel, User, Manager
from inventory.models import Discipline, Course, PackagePlan


class Command(BaseCommand):
    help = 'Наповнює базу даних стартовими (seed) даними'

    def handle(self, *args, **kwargs):
        self.stdout.write("Починаємо завантаження Seed-даних...")

        # 1. Базові ролі
        for role_name in ['Student', 'Teacher', 'Manager']:
            Role.objects.get_or_create(name=role_name)

        # 2. Рівні навчання (CEFR + класи)
        for level in ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', '1-4 клас', '5-11 клас']:
            StudentLevel.objects.get_or_create(name=level)
            TeacherLevel.objects.get_or_create(name=level)
        self.stdout.write(self.style.SUCCESS('✅ Ролі та рівні створені'))

        # 3. Адмін-менеджер
        manager_role = Role.objects.get(name='Manager')
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                'admin', 'admin@learnyx.com', 'adminpassword123',
                role_obj=manager_role,
            )
            self.stdout.write(self.style.SUCCESS('✅ Адмін створений'))

        # 4. Discipline + Course (required when creating Package records for students)
        discipline, _ = Discipline.objects.get_or_create(name='Загальні курси')
        Course.objects.get_or_create(
            title='Основний курс',
            defaults={
                'discipline': discipline,
                'description': 'Базовий навчальний курс LearNYX',
                'total_lessons_course': 100,
                'is_active': True,
            },
        )
        self.stdout.write(self.style.SUCCESS('✅ Discipline та Course створені'))

        # 5. PackagePlan records — displayed to all users, used as price templates
        #    Actual Package records are created per-student on account approval.
        plans_data = [
            {'name': 'Стартовий', 'total_lessons': 8,  'price': '2400.00', 'description': 'Базовий пакет для початку навчання',         'is_active': True},
            {'name': 'Стандарт',  'total_lessons': 10, 'price': '2900.00', 'description': 'Найпопулярніший вибір студентів',             'is_active': True},
            {'name': 'Преміум',   'total_lessons': 12, 'price': '3400.00', 'description': 'Максимальний результат за мінімальну ціну',  'is_active': True},
        ]
        for plan_data in plans_data:
            PackagePlan.objects.get_or_create(name=plan_data['name'], defaults=plan_data)
        self.stdout.write(self.style.SUCCESS('✅ PackagePlan записи створені (8, 10, 12 уроків)'))

        self.stdout.write(self.style.SUCCESS('🎉 База даних успішно просідована!'))