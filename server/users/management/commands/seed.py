from django.core.management.base import BaseCommand
from users.models import Role, StudentLevel, TeacherLevel, User, Manager
from inventory.models import Discipline, Course, PackagePlan, Topic, CurriculumLesson


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
        
        # Створюємо адміна більш безпечним методом get_or_create
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@learnyx.com',
                'role_obj': manager_role,
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin_user.set_password('adminpassword123')
            admin_user.save()
            
        # Обов'язково створюємо профіль менеджера для адміна, щоб не ламалися зв'язки БД!
        Manager.objects.get_or_create(user=admin_user, defaults={'is_active': True})
        self.stdout.write(self.style.SUCCESS('✅ Адмін та профіль Manager створені'))

        # 4. Discipline -> Course -> Topic -> CurriculumLesson
        discipline, _ = Discipline.objects.get_or_create(name='Загальні курси')
        course, _ = Course.objects.get_or_create(
            title='Основний курс',
            defaults={
                'discipline': discipline,
                'description': 'Базовий навчальний курс LearNYX',
                'total_lessons_course': 100,
                'is_active': True,
            },
        )
        
        # Додаємо Тему (Topic)
        topic, _ = Topic.objects.get_or_create(
            course=course,
            title='Вступний модуль',
            defaults={'description': 'Перші кроки на платформі', 'order_index': 1}
        )
        
        # Додаємо Шаблон уроку (CurriculumLesson)
        CurriculumLesson.objects.get_or_create(
            topic=topic,
            title='Урок 1: Ознайомлення',
            defaults={
                'description': 'Базова інформація для початку',
                'default_homework': 'Заповнити профіль',
                'order_index': 1
            }
        )
        self.stdout.write(self.style.SUCCESS('✅ Ланцюжок Discipline ➔ Course ➔ Topic ➔ Lesson створено'))

        # 5. PackagePlan records
        plans_data = [
            {'name': 'Стартовий', 'total_lessons': 8,  'price': '2400.00', 'description': 'Базовий пакет для початку навчання',         'is_active': True},
            {'name': 'Стандарт',  'total_lessons': 10, 'price': '2900.00', 'description': 'Найпопулярніший вибір студентів',             'is_active': True},
            {'name': 'Преміум',   'total_lessons': 12, 'price': '3400.00', 'description': 'Максимальний результат за мінімальну ціну',  'is_active': True},
        ]
        for plan_data in plans_data:
            PackagePlan.objects.get_or_create(name=plan_data['name'], defaults=plan_data)
        self.stdout.write(self.style.SUCCESS('✅ PackagePlan записи створені (8, 10, 12 уроків)'))

        self.stdout.write(self.style.SUCCESS('🎉 База даних успішно просідована!'))
        