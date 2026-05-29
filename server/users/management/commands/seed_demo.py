"""
Demo seed — generates realistic data for presentation.
Usage: python manage.py seed_demo
"""
import random
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = 'Seed database with realistic demo data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding demo data...')
        self._create_base_data()
        self._create_users()
        self._create_packages()
        self._create_slots_and_lessons()
        self._create_course_completions()
        self._create_complaints()
        self._create_learning_requests()
        self._print_credentials()
        self.stdout.write(self.style.SUCCESS('Demo seed completed!'))

    # ------------------------------------------------------------------ base
    def _create_base_data(self):
        from inventory.models import Course, Discipline, PackagePlan
        from users.models import Role, StudentLevel, TeacherLevel

        for name in ['Student', 'Teacher', 'Manager']:
            Role.objects.get_or_create(name=name)

        # ОНОВЛЕНО: Нова структура рівнів знань
        general_levels = [
            'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 
            '1-4 клас', '5-11 клас', 'Дошкільнята', 
            'Підготовка до НМТ/ЗНО', 'Дорослі (Business)'
        ]
        english_levels = ['A1-B1', 'B1-B2', 'B2-C1', 'С1-С2']
        
        all_levels = list(set(general_levels + english_levels))
        for name in all_levels:
            StudentLevel.objects.get_or_create(name=name)

        for name in ['Junior', 'Middle', 'Senior']:
            TeacherLevel.objects.get_or_create(name=name)

        plans = [
            {'name': 'Стартовий', 'total_lessons': 8,  'price': '2400.00'},
            {'name': 'Стандарт',  'total_lessons': 10, 'price': '2900.00'},
            {'name': 'Преміум',   'total_lessons': 12, 'price': '3400.00'},
        ]
        for p in plans:
            PackagePlan.objects.get_or_create(name=p['name'], defaults=p)

        disc1, _ = Discipline.objects.get_or_create(name='Математика')
        disc2, _ = Discipline.objects.get_or_create(name='Англійська мова')
        disc3, _ = Discipline.objects.get_or_create(name='Програмування')
        self.discs = [disc1, disc2, disc3]

        c1, _ = Course.objects.get_or_create(
            title='Математика базовий',
            defaults={'discipline': disc1, 'total_lessons_course': 20, 'is_active': True,
                      'discount_milestones': {'85': 5, '90': 10, '95': 15}},
        )
        c2, _ = Course.objects.get_or_create(
            title='Англійська для початківців',
            defaults={'discipline': disc2, 'total_lessons_course': 20, 'is_active': True,
                      'discount_milestones': {'85': 5, '90': 10, '95': 15}},
        )
        c3, _ = Course.objects.get_or_create(
            title='Python з нуля',
            defaults={'discipline': disc3, 'total_lessons_course': 20, 'is_active': True,
                      'discount_milestones': {'85': 5, '90': 10, '95': 15}},
        )
        self.courses = [c1, c2, c3]
        self.stdout.write('  Base data: roles, levels, plans, courses')

    # ------------------------------------------------------------------ users
    def _create_users(self):
        from inventory.models import Teacher
        from users.models import Manager, Role, Student, StudentLevel, TeacherLevel, User, StudentDisciplineLevel

        sr = Role.objects.get(name='Student')
        tr = Role.objects.get(name='Teacher')
        mr = Role.objects.get(name='Manager')
        
        # ОНОВЛЕНО: Отримуємо нові рівні для прив'язки
        lv_math = StudentLevel.objects.get(name='Підготовка до НМТ/ЗНО')
        lv_math_basic = StudentLevel.objects.get(name='5-11 клас')
        lv_eng_mid = StudentLevel.objects.get(name='B1-B2')
        lv_eng_beg = StudentLevel.objects.get(name='A1-B1')
        lv_prog = StudentLevel.objects.get(name='A1')
        
        tlv = TeacherLevel.objects.get(name='Senior')

        # Manager
        mgr, _ = User.objects.get_or_create(
            email='manager@learnyx.com',
            defaults={'username': 'manager', 'first_name': 'Олена', 'last_name': 'Петрівна',
                      'role_obj': mr, 'is_approved': True},
        )
        mgr.set_password('Manager1234!')
        mgr.save()
        Manager.objects.get_or_create(user=mgr)
        self.mgr = mgr

        # Teachers
        teachers_spec = [
            ('teacher1@learnyx.com', 'teacher1', 'Іван',  'Коваль',     self.discs[0]),
            ('teacher2@learnyx.com', 'teacher2', 'Марія', 'Шевченко',   self.discs[1]),
            ('teacher3@learnyx.com', 'teacher3', 'Олег',  'Бондаренко', self.discs[2]),
        ]
        self.teachers = []
        for email, uname, fn, ln, disc in teachers_spec:
            u, _ = User.objects.get_or_create(
                email=email,
                defaults={'username': uname, 'first_name': fn, 'last_name': ln,
                          'role_obj': tr, 'is_approved': True},
            )
            u.set_password('Teacher1234!')
            u.save()
            t, _ = Teacher.objects.get_or_create(
                user=u,
                defaults={'discipline': disc, 'level': tlv, 'salary': Decimal('500')},
            )
            self.teachers.append(t)

        # Students
        # ОНОВЛЕНО: Тепер передаємо дисципліну та конкретний рівень для створення StudentDisciplineLevel
        students_spec = [
            ('student1@learnyx.com', 'student1', 'Андрій',   'Мельник',   Decimal('5000'), self.discs[0], lv_math),
            ('student2@learnyx.com', 'student2', 'Катерина', 'Іванова',   Decimal('8000'), self.discs[1], lv_eng_mid),
            ('student3@learnyx.com', 'student3', 'Дмитро',   'Сидоренко', Decimal('3000'), self.discs[2], lv_prog),
            ('student4@learnyx.com', 'student4', 'Оксана',   'Ткаченко',  Decimal('6000'), self.discs[0], lv_math_basic),
            ('student5@learnyx.com', 'student5', 'Максим',   'Лисенко',   Decimal('2000'), self.discs[1], lv_eng_beg),
        ]
        self.students = []
        for email, uname, fn, ln, balance, disc, level_obj in students_spec:
            u, _ = User.objects.get_or_create(
                email=email,
                defaults={'username': uname, 'first_name': fn, 'last_name': ln,
                          'role_obj': sr, 'is_approved': True},
            )
            u.set_password('Student1234!')
            u.save()
            
            # ОНОВЛЕНО: Видалено поле level з моделі Student
            s, _ = Student.objects.get_or_create(
                user=u,
                defaults={'money_balance': balance},
            )
            
            # ОНОВЛЕНО: Прив'язка рівня до предмета через нову таблицю
            StudentDisciplineLevel.objects.get_or_create(
                student=s, 
                discipline=disc, 
                defaults={'level': level_obj}
            )
            
            self.students.append(s)

        self.stdout.write('  Users: 1 manager, 3 teachers, 5 students')

    # ---------------------------------------------------------------- packages
    def _create_packages(self):
        from inventory.models import Package

        cfg = [
            # (student_idx, course_idx, total, balance, price, status)
            (0, 0, 10,  7, Decimal('2900'), 'active'),
            (1, 1, 12, 10, Decimal('3400'), 'active'),
            (2, 2,  8,  5, Decimal('2400'), 'active'),
            (3, 0, 10,  8, Decimal('2900'), 'active'),
            (4, 1,  8,  8, Decimal('2400'), 'available'),
        ]
        self.packages = []
        for si, ci, total, balance, price, status in cfg:
            course = self.courses[ci]
            pkg, _ = Package.objects.get_or_create(
                student=self.students[si],
                status=status,
                defaults={
                    'course': course,
                    'discipline': course.discipline,
                    'total_lessons': total,
                    'balance': balance,
                    'final_price': price,
                    'discount': Decimal('0'),
                },
            )
            self.packages.append(pkg)

        self.stdout.write('  Packages: 4 active, 1 available')

    # -------------------------------------------------------- slots & lessons
    def _create_slots_and_lessons(self):
        from inventory.models import JournalRecord, Lesson, Slot

        now = timezone.now()

        def dt(days, hour):
            d = now + timedelta(days=days)
            return d.replace(hour=hour, minute=0, second=0, microsecond=0)

        # (days_from_now, hour) — each unique per teacher rotation
        past_schedule = [
            (-21, 10), (-21, 14),
            (-19, 10), (-19, 14),
            (-14, 10), (-14, 14),
            (-12, 10), (-12, 14),
            (-7,  10), (-7,  14),
            (-5,  10), (-5,  14),
            (-2,  10), (-2,  14),
            (-1,  10),
        ]
        future_schedule = [
            (1, 10), (1, 14),
            (3, 10), (3, 14),
            (5, 10),
            (8, 10), (8, 14),
            (10, 10),
            (15, 10), (15, 14),
            (17, 10),
            (20, 10), (20, 14),
            (22, 10),
        ]

        self.conducted_lessons = []
        self.missed_lesson = None

        # Past slots → lessons (conducted / missed)
        for i, (days, hour) in enumerate(past_schedule):
            teacher = self.teachers[i % 3]
            si = i % 4
            student = self.students[si]
            pkg = self.packages[si]

            start = dt(days, hour)
            try:
                slot = Slot.objects.create(
                    teacher=teacher, start_time=start,
                    end_time=start + timedelta(hours=1), status='booked',
                )
            except Exception:
                continue

            if i == 6:
                lesson_status = Lesson.Status.TEACHER_MISSED
            elif i == 11:
                lesson_status = Lesson.Status.STUDENT_MISSED
            else:
                lesson_status = Lesson.Status.CONDUCTED

            lesson = Lesson.objects.create(
                slot=slot, student=student, package=pkg,
                status=lesson_status,
                meeting_link='https://meet.google.com/demo-link',
            )

            if lesson_status == Lesson.Status.CONDUCTED:
                hw_cycle = [
                    JournalRecord.HomeworkStatus.REVIEWED,
                    JournalRecord.HomeworkStatus.SUBMITTED,
                    JournalRecord.HomeworkStatus.ASSIGNED,
                ]
                hw_status = hw_cycle[i % 3]
                submitted_at = (now - timedelta(days=abs(days) - 1)
                                if hw_status in (JournalRecord.HomeworkStatus.SUBMITTED,
                                                 JournalRecord.HomeworkStatus.REVIEWED)
                                else None)
                reviewed_at = (now - timedelta(hours=random.randint(1, 24))
                               if hw_status == JournalRecord.HomeworkStatus.REVIEWED
                               else None)
                JournalRecord.objects.create(
                    lesson=lesson,
                    is_present=True,
                    grade=random.randint(6, 10),
                    activity_grade=random.randint(5, 10),
                    teacher_homework_task={'description': f'Завдання #{i + 1}: виконати вправи'},
                    homework_grade=random.randint(5, 10) if hw_status == JournalRecord.HomeworkStatus.REVIEWED else None,
                    homework_status=hw_status,
                    homework_submitted_at=submitted_at,
                    reviewed_at=reviewed_at,
                )
                self.conducted_lessons.append(lesson)
            elif lesson_status == Lesson.Status.TEACHER_MISSED:
                self.missed_lesson = lesson

        # Future slots → scheduled lessons + free slots
        for i, (days, hour) in enumerate(future_schedule):
            teacher = self.teachers[i % 3]
            si = i % 4
            student = self.students[si]
            pkg = self.packages[si]

            start = dt(days, hour)
            is_booked = i < 5
            try:
                slot = Slot.objects.create(
                    teacher=teacher, start_time=start,
                    end_time=start + timedelta(hours=1),
                    status='booked' if is_booked else 'available',
                )
            except Exception:
                continue

            if is_booked:
                Lesson.objects.create(
                    slot=slot, student=student, package=pkg,
                    status=Lesson.Status.SCHEDULED,
                    meeting_link='https://meet.google.com/demo-link' if i < 3 else None,
                )

        self.stdout.write('  Slots and lessons + journal records')

    # --------------------------------------------------- course completions
    def _create_course_completions(self):
        from inventory.models import CourseCompletion

        completions = [
            (self.students[0], self.courses[0], 92, 10),
            (self.students[1], self.courses[1], 96, 15),
            (self.students[2], self.courses[2], 87,  5),
        ]
        for student, course, points, discount in completions:
            CourseCompletion.objects.get_or_create(
                student=student, course=course,
                defaults={
                    'completed_lessons_count': 10,
                    'total_points': points,
                    'earned_discount': discount,
                    'is_discount_used': False,
                    'completed_at': timezone.now() - timedelta(days=30),
                },
            )
        self.stdout.write('  Course completions (10%, 15%, 5% cashback)')

    # ------------------------------------------------------------- complaints
    def _create_complaints(self):
        from inventory.models import Complaint

        # Complaint on teacher_missed lesson (pending)
        if self.missed_lesson:
            Complaint.objects.get_or_create(
                lesson=self.missed_lesson, student=self.missed_lesson.student,
                defaults={
                    'reason': "Викладач не з'явився на урок без попередження",
                    'status': Complaint.Status.PENDING,
                },
            )

        # Complaint on first conducted lesson (reviewed)
        if self.conducted_lessons:
            first = self.conducted_lessons[0]
            Complaint.objects.get_or_create(
                lesson=first, student=first.student,
                defaults={
                    'reason': 'Урок тривав лише 20 хвилин замість 60',
                    'status': Complaint.Status.REVIEWED,
                    'reviewed_at': timezone.now() - timedelta(days=5),
                },
            )

        self.stdout.write('  Complaints: 1 pending, 1 reviewed')

    # -------------------------------------------------------- learning requests
    def _create_learning_requests(self):
        from inventory.models import LearningRequest

        LearningRequest.objects.get_or_create(
            student=self.students[3], subject='math',
            defaults={
                'package': self.packages[3],
                'level': 'Підготовка до НМТ/ЗНО', # ОНОВЛЕНО на нову назву
                'notes': 'Хочу підтягнути алгебру перед іспитами',
                'status': 'pending',
            },
        )
        LearningRequest.objects.get_or_create(
            student=self.students[4], subject='english',
            defaults={
                'package': self.packages[4],
                'level': 'A1-B1', # ОНОВЛЕНО на нову назву
                'notes': 'Починаю вивчення англійської з нуля',
                'status': 'pending',
            },
        )
        self.stdout.write('  Learning requests: 2 pending')

    # ------------------------------------------------------------ credentials
    def _print_credentials(self):
        sep = '=' * 50
        self.stdout.write(f'\n{sep}')
        self.stdout.write('DEMO CREDENTIALS')
        self.stdout.write(sep)
        self.stdout.write('MANAGER:  manager@learnyx.com  / Manager1234!')
        self.stdout.write('TEACHERS: teacher1@learnyx.com / Teacher1234!')
        self.stdout.write('          teacher2@learnyx.com / Teacher1234!')
        self.stdout.write('          teacher3@learnyx.com / Teacher1234!')
        self.stdout.write('STUDENTS: student1@learnyx.com / Student1234!')
        self.stdout.write('          student2@learnyx.com / Student1234!')
        self.stdout.write('          student3@learnyx.com / Student1234!')
        self.stdout.write('          student4@learnyx.com / Student1234!')
        self.stdout.write('          student5@learnyx.com / Student1234!')
        self.stdout.write(sep)
        