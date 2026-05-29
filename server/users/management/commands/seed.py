from django.core.management.base import BaseCommand
from users.models import Role, StudentLevel, TeacherLevel, User
from inventory.models import Discipline, Course, PackagePlan


class Command(BaseCommand):
    help = 'Наповнює базу даних стартовими (seed) даними'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("Починаємо завантаження Seed-даних..."))

        # 1. Базові ролі (додано збереження об'єктів у словник для швидкого доступу)
        roles_objs = {}
        for role_name in ['Student', 'Teacher', 'Manager', 'Admin']:
            role, _ = Role.objects.get_or_create(name=role_name)
            roles_objs[role_name] = role
        self.stdout.write(self.style.SUCCESS('Ролі створені'))

        # 2. Дисципліни 
        disciplines_data = ['Загальні курси', 'Англійська мова', 'Математика', 'Українська мова', 'Програмування']
        disciplines_objs = {}
        for d_name in disciplines_data:
            obj, _ = Discipline.objects.get_or_create(name=d_name)
            disciplines_objs[d_name] = obj
        self.stdout.write(self.style.SUCCESS('Дисципліни створені'))

        # 3. Рівні навчання 
        general_levels = [
            'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 
            '1-4 клас', '5-11 клас', 'Дошкільнята', 
            'Підготовка до НМТ/ЗНО', 'Дорослі (Business)'
        ]
        english_levels = ['A1-B1', 'B1-B2', 'B2-C1', 'С1-С2']
        all_levels = list(set(general_levels + english_levels))

        level_objs = {}
        for level in all_levels:
            sl_obj, _ = StudentLevel.objects.update_or_create(
                name__iexact=level, defaults={'name': level}
            )
            TeacherLevel.objects.update_or_create(
                name__iexact=level, defaults={'name': level}
            )
            level_objs[level] = sl_obj
            
        self.stdout.write(self.style.SUCCESS('Рівні-довідники створені та оновлені'))

        # 4. Користувачі системи (Адмін, Менеджер, Викладач)
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@learnyx.com', 'adminpassword123', role_obj=roles_objs['Admin'])
            self.stdout.write(self.style.SUCCESS('Адмін створений'))
        else:
             self.stdout.write(self.style.SUCCESS('Адмін вже існує (пропущено)'))

        # Створення Менеджера
        User.objects.get_or_create(
            email='manager@learnyx.com',
            defaults={'username': 'manager', 'first_name': 'Анна', 'last_name': 'Менеджер', 'role_obj': roles_objs['Manager'], 'is_approved': True}
        )[0].set_password('manager123')

        # Створення Викладача
        User.objects.get_or_create(
            email='teacher@learnyx.com',
            defaults={'username': 'teacher', 'first_name': 'Іван', 'last_name': 'Викладач', 'role_obj': roles_objs['Teacher'], 'is_approved': True}
        )[0].set_password('teacher123')

        self.stdout.write(self.style.SUCCESS('Персонал (Менеджер, Викладач) створений'))

        # 5. Тестові Студенти та прив'язка різних рівнів до різних дисциплін
        # --- Студент 1 (Влад) ---
        test_user1, _ = User.objects.get_or_create(
            email='student@learnyx.com',
            defaults={'username': 'student', 'first_name': 'Влад', 'last_name': 'Студент', 'role_obj': roles_objs['Student'], 'is_approved': True}
        )
        test_user1.set_password('studentpassword123')
        test_user1.save()
        test_student1, _ = Student.objects.get_or_create(user=test_user1)

        StudentDisciplineLevel.objects.get_or_create(student=test_student1, discipline=disciplines_objs['Англійська мова'], defaults={'level': level_objs['B1-B2']})
        StudentDisciplineLevel.objects.get_or_create(student=test_student1, discipline=disciplines_objs['Математика'], defaults={'level': level_objs['Підготовка до НМТ/ЗНО']})
        StudentDisciplineLevel.objects.get_or_create(student=test_student1, discipline=disciplines_objs['Програмування'], defaults={'level': level_objs['A1']})

        # --- Студент 2 (Олена) ---
        test_user2, _ = User.objects.get_or_create(
            email='olena@learnyx.com',
            defaults={'username': 'olena_st', 'first_name': 'Олена', 'last_name': 'Студентка', 'role_obj': roles_objs['Student'], 'is_approved': True}
        )
        test_user2.set_password('studentpassword123')
        test_user2.save()
        test_student2, _ = Student.objects.get_or_create(user=test_user2)

        StudentDisciplineLevel.objects.get_or_create(student=test_student2, discipline=disciplines_objs['Англійська мова'], defaults={'level': level_objs['A1-B1']})
        StudentDisciplineLevel.objects.get_or_create(student=test_student2, discipline=disciplines_objs['Українська мова'], defaults={'level': level_objs['Підготовка до НМТ/ЗНО']})

        # --- Студент 3 (Максим) ---
        test_user3, _ = User.objects.get_or_create(
            email='maksym@learnyx.com',
            defaults={'username': 'maksym_st', 'first_name': 'Максим', 'last_name': 'Студент', 'role_obj': roles_objs['Student'], 'is_approved': True}
        )
        test_user3.set_password('studentpassword123')
        test_user3.save()
        test_student3, _ = Student.objects.get_or_create(user=test_user3)

        StudentDisciplineLevel.objects.get_or_create(student=test_student3, discipline=disciplines_objs['Математика'], defaults={'level': level_objs['5-11 клас']})
        StudentDisciplineLevel.objects.get_or_create(student=test_student3, discipline=disciplines_objs['Програмування'], defaults={'level': level_objs['B1']})

        self.stdout.write(self.style.SUCCESS('Тестові студенти (3 особи) та їх розділені рівні створені'))

        # 6. Курси (Без змін)
        courses_data = [
            {
                'title': 'Українська мова для НМТ',
                'discipline': disciplines_objs['Загальні курси'],
                'description': 'Інтенсивна підготовка до складання НМТ на 200 балів',
                'total_lessons_course': 100,
            },
            {
                'title': 'Англійська мова',
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

        # 7. Пакетні плани (Без змін)
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