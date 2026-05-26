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

        # =========================================================
        # ЧАСТИНА 2: НОВІ ДАНІ ДЛЯ ЕТАПУ 5 (The Big Merge)
        # =========================================================

        # 6. Створюємо тестову Дисципліну та Курс
        discipline, _ = Discipline.objects.get_or_create(name="Англійська мова")
        course, _ = Course.objects.get_or_create(
            discipline=discipline, 
            title="English Grammar Advanced", 
            defaults={"total_lessons_course": 20, "is_active": True}
        )

        # 7. Створюємо Демо-Студента та Викладача (щоб не чіпати твого вимкненого студента)
        student_role = Role.objects.get(name='Student')
        teacher_role = Role.objects.get(name='Teacher')
        user_demo_student, _ = User.objects.get_or_create(
            email='demo_student@learnyx.com', 
            defaults={'username': 'demo_student', 'first_name': 'Олег', 'last_name': 'Демо', 'role_obj': student_role}
        )
        demo_student, _ = Student.objects.get_or_create(user=user_demo_student, defaults={'money_balance': 2000.00})

        user_demo_teacher, _ = User.objects.get_or_create(
            email='demo_teacher@learnyx.com', 
            defaults={'username': 'demo_teacher', 'first_name': 'Олена', 'last_name': 'Вчитель', 'role_obj': teacher_role}
        )
        demo_teacher, _ = Teacher.objects.get_or_create(user=user_demo_teacher, defaults={'discipline': discipline, 'salary': 350.00})

        # 8. ТАРИФНІ ПЛАНИ (PackagePlans)
        plan_intensive, _ = PackagePlan.objects.get_or_create(
            name="Інтенсив (20 занять)",
            defaults={"total_lessons": 20, "price": 5500.00, "description": "Для швидкого результату"}
        )

        # 9. МАТЕРІАЛИ ДЛЯ ВИКЛАДАЧА (Materials)
        Material.objects.get_or_create(
            title="English Grammar in Use (Advanced)",
            teacher=demo_teacher,
            defaults={"file_url": "https://learnyx-storage.com/books/english_adv.pdf"}
        )

        # 10. ЗАВЕРШЕННЯ КУРСУ ТА ЗНИЖКА (CourseCompletion)
        completion, _ = CourseCompletion.objects.get_or_create(
            student=demo_student,
            course=course,
            defaults={
                "completed_lessons_count": 20,
                "total_points": 185,
                "earned_discount": 15,
                "is_discount_used": True,
                "completed_at": timezone.now()
            }
        )

        # 11. КУПЛЕНИЙ ПАКЕТ (Package)
        test_package, _ = Package.objects.get_or_create(
            student=demo_student,
            course=course,
            defaults={
                "discipline": discipline,
                "completed": completion,
                "total_lessons": plan_intensive.total_lessons,
                "discount": 15.00,
                "final_price": 4675.00,
                "balance": plan_intensive.total_lessons,
                "status": "active"
            }
        )

        # 12. ЗАЯВКА НА ПІДБІР ВИКЛАДАЧА (LearningRequest)
        LearningRequest.objects.get_or_create(
            student=demo_student,
            subject="Англійська мова",
            defaults={
                "package": test_package,
                "level": "B2",
                "preferred_days": "Пн, Ср, Пт",
                "preferred_time": "18:00 - 20:00",
                "notes": "Бажано викладача з досвідом підготовки до IELTS",
                "status": "pending"
            }
        )

        # 13. ФІНАНСОВІ ТРАНЗАКЦІЇ (Transactions)
        Transaction.objects.get_or_create(
            teacher=demo_teacher,
            title="Оплата за проведений урок",
            defaults={"amount": 350.00, "is_penalty": False, "description": "Стандартна ставка"}
        )

        self.stdout.write(self.style.SUCCESS('✅ Нові сутності (Тарифи, Пакети, Фінанси) завантажено!'))
        self.stdout.write(self.style.SUCCESS('🎉 База даних успішно просідована!'))