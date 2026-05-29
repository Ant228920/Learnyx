from django.core.management.base import BaseCommand
from users.models import Role, StudentLevel, TeacherLevel, User
from inventory.models import Discipline, Course, PackagePlan


class Command(BaseCommand):
    help = 'Наповнює базу даних стартовими (seed) даними'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("Починаємо завантаження Seed-даних..."))

        # 1. Базові ролі (додано Admin)
        for role_name in ['Student', 'Teacher', 'Manager', 'Admin']:
            Role.objects.get_or_create(name=role_name)
        self.stdout.write(self.style.SUCCESS('Ролі створені'))

        # 2. Рівні навчання (додано дошкільнят та специфічні напрямки)
        levels = [
            'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 
            '1-4 клас', '5-11 клас', 'Дошкільнята', 
            'Підготовка до НМТ/ЗНО', 'Дорослі (Business)'
        ]
        
        # Використовуємо update_or_create з __iexact для ігнорування регістру при пошуку,
        # але примусово встановлюємо правильний регістр (defaults).
        for level in levels:
            StudentLevel.objects.update_or_create(
                name__iexact=level, 
                defaults={'name': level}
            )
            TeacherLevel.objects.update_or_create(
                name__iexact=level, 
                defaults={'name': level}
            )
        self.stdout.write(self.style.SUCCESS('Рівні створені та оновлені'))

        # 3. Адмін-менеджер
        manager_role = Role.objects.get(name='Manager')
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                'admin', 'admin@learnyx.com', 'adminpassword123',
                role_obj=manager_role,
            )
            self.stdout.write(self.style.SUCCESS('Адмін створений'))
        else:
             self.stdout.write(self.style.SUCCESS('Адмін вже існує (пропущено)'))

        # 4. Дисципліни
        disciplines_data = ['Загальні курси', 'Англійська мова', 'Математика', 'Українська мова', 'Програмування']
        disciplines_objs = {}
        for d_name in disciplines_data:
            obj, _ = Discipline.objects.get_or_create(name=d_name)
            disciplines_objs[d_name] = obj
        self.stdout.write(self.style.SUCCESS('Дисципліни створені'))

        # 5. Курси (розширено специфічними програмами)
        courses_data = [
            {
                'title': 'Основний курс',
                'discipline': disciplines_objs['Загальні курси'],
                'description': 'Базовий навчальний курс LearNYX',
                'total_lessons_course': 100,
            },
            {
                'title': 'Англійська для IT',
                'discipline': disciplines_objs['Англійська мова'],
                'description': 'Спеціалізований курс для розробників та QA',
                'total_lessons_course': 50,
            },
            {
                'title': 'Підготовка до НМТ з Математики',
                'discipline': disciplines_objs['Математика'],
                'description': 'Інтенсивна підготовка до складання НМТ на 200 балів',
                'total_lessons_course': 60,
            },
            {
                'title': 'Front-End (Vue.js) з нуля',
                'discipline': disciplines_objs['Програмування'],
                'description': 'Практичний курс з розробки інтерфейсів',
                'total_lessons_course': 40,
            },
        ]
        
        for c_data in courses_data:
            Course.objects.get_or_create(
                title=c_data['title'],
                defaults={
                    'discipline': c_data['discipline'],
                    'description': c_data['description'],
                    'total_lessons_course': c_data['total_lessons_course'],
                    'is_active': True,
                },
            )
        self.stdout.write(self.style.SUCCESS('Курси створені'))

        # 6. Пакетні плани (додано пробний та великий інтенсив)
        plans_data = [
            {'name': 'Пробний', 'total_lessons': 1, 'price': '300.00', 'description': 'Одне заняття для знайомства з платформою', 'is_active': True},
            {'name': 'Стартовий', 'total_lessons': 8, 'price': '2400.00', 'description': 'Базовий пакет для початку навчання', 'is_active': True},
            {'name': 'Стандарт', 'total_lessons': 10, 'price': '2900.00', 'description': 'Найпопулярніший вибір студентів', 'is_active': True},
            {'name': 'Преміум', 'total_lessons': 12, 'price': '3400.00', 'description': 'Максимальний результат за мінімальну ціну', 'is_active': True},
            {'name': 'Інтенсив', 'total_lessons': 24, 'price': '6400.00', 'description': 'Великий пакет для максимального занурення', 'is_active': True},
        ]
        for plan_data in plans_data:
            PackagePlan.objects.get_or_create(name=plan_data['name'], defaults=plan_data)
        self.stdout.write(self.style.SUCCESS('Пакетні плани створені (1, 8, 10, 12, 24 уроків)'))

        self.stdout.write(self.style.SUCCESS('База даних успішно просідована розширеними даними!'))