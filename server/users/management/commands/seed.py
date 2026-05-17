from django.core.management.base import BaseCommand
from users.models import Role, StudentLevel, TeacherLevel, User, Student, Manager, Request
from inventory.models import Discipline, Course, PackagePlan

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

        # 5. Тестовий Студент — вимкнено, щоб не створювати student@test.com у demo-середовищі
        student_role = Role.objects.get(name='Student')  # noqa: F841 (used below if re-enabled)

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

        # 7. PackagePlan records (what GET /packages/ returns; what POST /packages/{id}/purchase/ uses)
        plans_data = [
            {
                'name': 'Стартовий',
                'total_lessons': 8,
                'price': '2400.00',
                'description': 'Базовий пакет для початку навчання',
                'is_active': True,
            },
            {
                'name': 'Стандарт',
                'total_lessons': 16,
                'price': '4400.00',
                'description': 'Найпопулярніший вибір студентів',
                'is_active': True,
            },
            {
                'name': 'Преміум',
                'total_lessons': 32,
                'price': '8000.00',
                'description': 'Максимальний результат за мінімальну ціну',
                'is_active': True,
            },
        ]
        for plan_data in plans_data:
            PackagePlan.objects.get_or_create(
                name=plan_data['name'],
                defaults=plan_data,
            )
        self.stdout.write(self.style.SUCCESS('✅ PackagePlan записи створені (3 плани)'))

        self.stdout.write(self.style.SUCCESS('🎉 База даних успішно просідована!'))