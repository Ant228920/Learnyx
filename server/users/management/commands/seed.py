"""
Seed — базові довідники та адмін.
Usage: python manage.py seed
"""
from django.core.management.base import BaseCommand
from inventory.models import Course, Discipline, PackagePlan
from users.models import Role, StudentLevel, Student, TeacherLevel, User


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

        # Demo student with completed history and 15% bonus ready to use
        self.stdout.write(self.style.WARNING('Створюємо демо студента з бонусом...'))
        try:
            from inventory.models import (
                Package, Slot, Lesson, JournalRecord, CourseCompletion, Teacher,
            )
            from decimal import Decimal
            import datetime
            from django.utils import timezone

            # 1. Demo user
            demo_user, created = User.objects.get_or_create(
                email='demo_bonus@learnyx.com',
                defaults={
                    'username': 'demo_bonus',
                    'first_name': 'Демо',
                    'last_name': 'Студент',
                    'phone': '+380991111222',
                    'nickname': '@demo_bonus',
                    'is_approved': True,
                    'role_obj': roles_objs['Student'],
                }
            )
            if created:
                demo_user.set_password('Demo1234!')
                demo_user.save()

            # 2. Student profile
            demo_student, _ = Student.objects.get_or_create(user=demo_user)

            # 3. Money balance
            demo_student.money_balance = Decimal('3000.00')
            demo_student.save(update_fields=['money_balance'])

            # 4. Completed package (10 lessons, balance=0)
            plan_10 = PackagePlan.objects.filter(total_lessons=10).first()
            completed_pkg, pkg_created = Package.objects.get_or_create(
                student=demo_student,
                status='completed',
                defaults={
                    'total_lessons': 10,
                    'balance': 0,
                    'final_price': plan_10.price if plan_10 else Decimal('2000.00'),
                    'discount': Decimal('0.00'),
                }
            )

            # 5. First available teacher
            demo_teacher = Teacher.objects.first()

            if demo_teacher and pkg_created:
                # 6. 10 conducted lessons with good grades
                for i in range(10):
                    lesson_date = timezone.now() - datetime.timedelta(days=70 - i * 7)
                    slot, _ = Slot.objects.get_or_create(
                        teacher=demo_teacher,
                        start_time=lesson_date,
                        defaults={
                            'end_time': lesson_date + datetime.timedelta(hours=1),
                            'status': 'booked',
                        }
                    )
                    lesson, _ = Lesson.objects.get_or_create(
                        slot=slot,
                        student=demo_student,
                        defaults={
                            'status': 'conducted',
                            'package': completed_pkg,
                        }
                    )
                    JournalRecord.objects.get_or_create(
                        lesson=lesson,
                        defaults={
                            'activity_grade': 9,
                            'homework_grade': 8,
                            'lesson_topic': f'Урок {i + 1} — Граматика',
                            'teacher_homework_task': {'task': f'Домашнє завдання {i + 1}'},
                            'homework_answer_url': '',
                        }
                    )

            # 7. CourseCompletion with 15% bonus; link back to package
            base_course = Course.objects.filter(title='Загальний курс').first()
            if base_course:
                completion, _ = CourseCompletion.objects.get_or_create(
                    student=demo_student,
                    course=base_course,
                    defaults={
                        'earned_discount': 15,
                        'is_discount_used': False,
                        'completed_lessons_count': 10,
                        'total_points': 170,
                    }
                )
                if completed_pkg.completed_id != completion.pk:
                    completed_pkg.completed = completion
                    completed_pkg.save(update_fields=['completed'])

            self.stdout.write(self.style.SUCCESS('✅ Демо студент з бонусом створений:'))
            self.stdout.write(self.style.SUCCESS('   Email: demo_bonus@learnyx.com'))
            self.stdout.write(self.style.SUCCESS('   Пароль: Demo1234!'))
            self.stdout.write(self.style.SUCCESS('   Бонус: 15% знижка на наступний абонемент'))
            self.stdout.write(self.style.SUCCESS('   Баланс: 3000 UAH'))
            self.stdout.write(self.style.SUCCESS('   Статус: немає активного абонементу — готовий до покупки з бонусом'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Помилка створення демо студента: {e}'))
            import traceback
            traceback.print_exc()
