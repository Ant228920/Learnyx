from django.test import TestCase
from django.utils import timezone
from django.db import IntegrityError
from rest_framework.test import APIClient, APIRequestFactory, force_authenticate
from unittest.mock import patch, MagicMock
from api.models import RegistrationRequest
from api.views import generate_password, RegistrationRequestView, ActivatePackageView, StudentBalanceView
from inventory.models import Slot, Teacher, Lesson, Package, JournalRecord, Course, Discipline, CourseCompletion
from users.models import User, Role, Student


class GeneratePasswordTest(TestCase):
    """Unit тести для generate_password"""

    def test_password_length(self):
        """Пароль має бути довжиною 10 символів"""
        password = generate_password(10)
        self.assertEqual(len(password), 10)

    def test_password_is_string(self):
        """Пароль має бути рядком"""
        password = generate_password()
        self.assertIsInstance(password, str)

    def test_passwords_are_unique(self):
        """Два паролі не мають бути однаковими"""
        p1 = generate_password()
        p2 = generate_password()
        self.assertNotEqual(p1, p2)




class RegistrationRequestModelTest(TestCase):
    """Unit тести для моделі RegistrationRequest"""

    def test_create_student_request(self):
        """Створення заявки для учня"""
        req = RegistrationRequest.objects.create(
            full_name='Іван Іваненко',
            phone='+380991234567',
            email='ivan@gmail.com',
            role='student',
        )
        self.assertEqual(req.status, 'new')
        self.assertEqual(req.role, 'student')

    def test_create_teacher_request_with_subject(self):
        """Створення заявки для викладача з предметом"""
        req = RegistrationRequest.objects.create(
            full_name='Марія Петренко',
            phone='+380991234568',
            email='maria@gmail.com',
            role='teacher',
            subject='Математика',
            level='Середній',
        )
        self.assertEqual(req.subject, 'Математика')
        self.assertEqual(req.level, 'Середній')

    def test_request_str(self):
        """Перевірка рядкового представлення"""
        req = RegistrationRequest.objects.create(
            full_name='Тест Тестов',
            phone='+380991234569',
            email='test2@gmail.com',
            role='student',
        )
        self.assertIn('Тест Тестов', str(req))

class ViewsUnitTests(TestCase):
    """
    Unit-тести для перевірки логіки у views.py.
    База даних повністю 'замокана' (ізольована).
    """

    def setUp(self):
        # APIRequestFactory дозволяє створювати запити без запуску сервера
        self.factory = APIRequestFactory()

    @patch('api.views.get_object_or_404')
    def test_activate_already_active_package(self, mock_get_object):
        """
        1. Тест логіки: Пакет не можна активувати двічі.
        Перевіряємо ActivatePackageView.
        """
        # Імітуємо, що з БД повернувся пакет, який вже активний
        mock_package = MagicMock()
        mock_package.status = 'active'
        mock_get_object.return_value = mock_package

        # Створюємо фейковий POST-запит
        request = self.factory.post('/api/packages/1/activate/')

        mock_user = MagicMock()
        force_authenticate(request, user=mock_user)

        # Викликаємо view напряму
        view = ActivatePackageView.as_view()
        response = view(request, pk=1)

        # Перевірки
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['message'], 'Пакет вже активовано.')
        mock_package.save.assert_not_called() # Перевіряємо, що збереження в БД не було

    @patch('api.views.Package.objects.filter')
    @patch('api.views.get_object_or_404')
    def test_student_balance_no_active_packages(self, mock_get_student, mock_filter_packages):
        """
        2. Тест логіки: Розрахунок балансу учня без активних пакетів.
        Перевіряємо StudentBalanceView.
        """
        # Імітуємо успішне знаходження учня
        mock_get_student.return_value = MagicMock()

        # Імітуємо, що метод .first() повертає None (активних пакетів немає)
        mock_queryset = MagicMock()
        mock_queryset.first.return_value = None
        mock_filter_packages.return_value = mock_queryset

        # Створюємо фейковий GET-запит
        request = self.factory.get('/api/balance/')

        mock_user = MagicMock()
        force_authenticate(request, user=mock_user)

        view = StudentBalanceView.as_view()
        response = view(request)

        # Перевірки
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['remaining_lessons'], 0)
        self.assertEqual(response.data['message'], 'У вас немає активних підписок.')

    @patch('api.views.send_mail')
    @patch('api.views.RegistrationRequestSerializer')
    def test_registration_request_success_and_email(self, mock_serializer_class, mock_send_mail):
        """
        3. Тест логіки: Успішна реєстрація та відправка email.
        Перевіряємо RegistrationRequestView.
        """
        # Імітуємо роботу серіалізатора, щоб він не ліз у БД
        mock_serializer_instance = MagicMock()
        mock_serializer_instance.is_valid.return_value = True

        # Імітуємо об'єкт, який "зберігся"
        mock_reg_request = MagicMock()
        mock_reg_request.id = 99
        mock_reg_request.full_name = 'Іван Франко'
        mock_reg_request.email = 'ivan@test.com'
        mock_reg_request.role = 'student'
        mock_serializer_instance.save.return_value = mock_reg_request

        mock_serializer_class.return_value = mock_serializer_instance

        # Створюємо фейковий запит із даними
        data = {
            'full_name': 'Іван Франко',
            'email': 'ivan@test.com',
            'role': 'student',
            'phone': '+380000000000'
        }
        request = self.factory.post('/api/register/', data=data)

        view = RegistrationRequestView.as_view()
        response = view(request)

        # Перевірки
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['id'], 99)
        self.assertEqual(response.data['message'], 'Готово! Ваша заявка успішно відправлена менеджеру.')

        # Перевіряємо, що лист був відправлений
        mock_send_mail.assert_called_once()
        args, kwargs = mock_send_mail.call_args
        self.assertIn('Іван Франко', kwargs['subject'])


# ---------------------------------------------------------------------------
# Integration tests — real test DB, no mocks
# ---------------------------------------------------------------------------

def _make_user(email, role_name, **extra):
    role, _ = Role.objects.get_or_create(name=role_name)
    user = User.objects.create_user(
        username=email,
        email=email,
        password='testpass123',
        first_name='Test',
        last_name='User',
        role_obj=role,
        is_approved=True,
        **extra,
    )
    return user


def _make_package(student, balance=10):
    discipline, _ = Discipline.objects.get_or_create(name='Math')
    course, _ = Course.objects.get_or_create(
        discipline=discipline,
        defaults={'title': 'Math 101', 'total_lessons_course': 20},
    )
    return Package.objects.create(
        student=student,
        course=course,
        total_lessons=balance,
        balance=balance,
        final_price='0.00',
        status='active',
    )


class LessonBookingIntegrationTest(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.teacher_user = _make_user('teacher@int.test', 'Teacher')
        self.teacher = Teacher.objects.create(user=self.teacher_user)

        self.student_user = _make_user('student@int.test', 'Student')
        self.student = Student.objects.create(user=self.student_user)

        self.package = _make_package(self.student, balance=10)

    def _login(self, user):
        self.client.force_authenticate(user=user)

    def test_create_slot_book_lesson_balance_decreases(self):
        # -- Teacher creates a slot --
        self._login(self.teacher_user)
        start = timezone.now() + timezone.timedelta(hours=1)
        end   = start + timezone.timedelta(hours=1)
        resp = self.client.post('/api/v1/slots/', {
            'start_time': start.isoformat(),
            'end_time':   end.isoformat(),
        })
        self.assertEqual(resp.status_code, 201)
        slot_id = resp.data['id']

        # -- Student books the lesson --
        self._login(self.student_user)
        resp = self.client.post('/api/v1/lessons/', {
            'slot':    slot_id,
            'package': self.package.pk,
        })
        self.assertEqual(resp.status_code, 201)
        lesson_id = resp.data['id']

        # Slot must be marked as booked
        self.assertEqual(Slot.objects.get(pk=slot_id).status, 'booked')

        # -- Teacher marks the lesson as conducted --
        self._login(self.teacher_user)
        resp = self.client.patch(
            f'/api/v1/lessons/{lesson_id}/status/',
            {'status': 'conducted'},
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['package_balance_remaining'], 9)

        # DB must reflect the deduction
        self.package.refresh_from_db()
        self.assertEqual(self.package.balance, 9)

    def test_double_booking_same_slot_returns_409(self):
        """Second booking of the same slot must be rejected with 409."""
        self._login(self.teacher_user)
        start = timezone.now() + timezone.timedelta(hours=2)
        end   = start + timezone.timedelta(hours=1)
        slot_id = self.client.post('/api/v1/slots/', {
            'start_time': start.isoformat(),
            'end_time':   end.isoformat(),
        }).data['id']

        # Create a second student + package for the second attempt
        student2_user = _make_user('student2@int.test', 'Student')
        student2 = Student.objects.create(user=student2_user)
        package2 = _make_package(student2, balance=10)

        self._login(self.student_user)
        self.client.post('/api/v1/lessons/', {'slot': slot_id, 'package': self.package.pk})

        self._login(student2_user)
        resp = self.client.post('/api/v1/lessons/', {'slot': slot_id, 'package': package2.pk})
        # DRF's unique-validator on Lesson.slot fires before our transaction re-check,
        # so normal double-booking returns 400; the 409 path is only reachable in a race.
        self.assertIn(resp.status_code, (400, 409))


class LessonEvaluateIntegrationTest(TestCase):
    """
    Teacher evaluates a lesson → JournalRecord is created in the DB.
    Second call with different grades → record is updated (no duplicate).
    """

    def setUp(self):
        self.client = APIClient()

        self.teacher_user = _make_user('teacher2@int.test', 'Teacher')
        self.teacher = Teacher.objects.create(user=self.teacher_user)

        self.student_user = _make_user('student3@int.test', 'Student')
        self.student = Student.objects.create(user=self.student_user)

        package = _make_package(self.student, balance=5)

        start = timezone.now() - timezone.timedelta(hours=1)
        slot = Slot.objects.create(
            teacher=self.teacher,
            start_time=start,
            end_time=start + timezone.timedelta(hours=1),
            status='booked',
        )
        self.lesson = Lesson.objects.create(
            slot=slot,
            student=self.student,
            package=package,
            status='conducted',
        )

    def test_evaluate_creates_journal_record(self):
        self.client.force_authenticate(user=self.teacher_user)
        payload = {
            'is_present':           True,
            'activity_grade':       8,
            'teacher_homework_task': 'Read chapter 3',
            'teacher_notes':        'Good progress',
        }
        resp = self.client.post(f'/api/v1/lessons/{self.lesson.pk}/evaluate/', payload, format='json')

        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['activity_grade'], 8)
        self.assertEqual(resp.data['teacher_notes'], 'Good progress')

        # Verify the record exists in the DB
        record = JournalRecord.objects.get(lesson=self.lesson)
        self.assertEqual(record.activity_grade, 8)
        self.assertTrue(record.is_present)

    def test_evaluate_updates_existing_record(self):
        self.client.force_authenticate(user=self.teacher_user)
        self.client.post(f'/api/v1/lessons/{self.lesson.pk}/evaluate/', {
            'is_present': True, 'activity_grade': 7,
        })

        resp = self.client.post(f'/api/v1/lessons/{self.lesson.pk}/evaluate/', {
            'activity_grade': 10,
        })

        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['activity_grade'], 10)

        # Only one record must exist
        self.assertEqual(JournalRecord.objects.filter(lesson=self.lesson).count(), 1)
        self.assertEqual(JournalRecord.objects.get(lesson=self.lesson).activity_grade, 10)

    def test_student_cannot_evaluate(self):
        self.client.force_authenticate(user=self.student_user)
        resp = self.client.post(f'/api/v1/lessons/{self.lesson.pk}/evaluate/', {
            'activity_grade': 10,
        })
        self.assertEqual(resp.status_code, 403)


# ---------------------------------------------------------------------------
# Transaction rollback tests — verify atomicity guarantees
# ---------------------------------------------------------------------------

class BookingRollbackTest(TestCase):
    """
    Booking chain: slot.status='booked' + Lesson.create are in one atomic block.
    If Lesson.save raises IntegrityError the slot must stay 'available' and no
    Lesson row may exist in the DB.
    """

    def setUp(self):
        self.client = APIClient()
        self.teacher_user = _make_user('rb_teacher@rollback.test', 'Teacher')
        self.teacher = Teacher.objects.create(user=self.teacher_user)
        self.student_user = _make_user('rb_student@rollback.test', 'Student')
        self.student = Student.objects.create(user=self.student_user)
        self.package = _make_package(self.student, balance=5)

        start = timezone.now() + timezone.timedelta(hours=3)
        self.slot = Slot.objects.create(
            teacher=self.teacher,
            start_time=start,
            end_time=start + timezone.timedelta(hours=1),
            status='available',
        )

    def test_lesson_save_failure_rolls_back_slot_status(self):
        """
        IntegrityError inside Lesson.save (simulated) must roll back
        slot.status to 'available' and leave zero Lesson rows in the DB.

        The patch targets Lesson.save at class level — slot.save() is
        Slot.save and is unaffected; the error fires only when the ORM
        tries to INSERT the new Lesson row.
        """
        self.client.force_authenticate(user=self.student_user)

        with patch.object(Lesson, 'save', side_effect=IntegrityError('forced booking error')):
            resp = self.client.post('/api/v1/lessons/', {
                'slot': self.slot.pk,
                'package': self.package.pk,
            })

        # custom_exception_handler converts unhandled IntegrityError → 500
        self.assertEqual(resp.status_code, 500)

        # Slot must NOT be booked — the atomic block rolled back slot.save() too
        self.slot.refresh_from_db()
        self.assertEqual(self.slot.status, 'available')

        # No Lesson row should exist
        self.assertFalse(Lesson.objects.filter(slot=self.slot).exists())


class CompletionBonusRollbackTest(TestCase):
    """
    Completion chain: lesson.status='conducted' + package.balance deduction +
    CourseCompletion.update_or_create are all in the same atomic block.
    If CourseCompletion.update_or_create raises IntegrityError the entire
    chain must roll back: lesson stays 'scheduled', balance stays intact,
    no CourseCompletion record created.
    """

    def setUp(self):
        self.client = APIClient()
        self.teacher_user = _make_user('rb_teacher2@rollback.test', 'Teacher')
        self.teacher = Teacher.objects.create(user=self.teacher_user)
        self.student_user = _make_user('rb_student2@rollback.test', 'Student')
        self.student = Student.objects.create(user=self.student_user)

        # balance=1: marking this lesson 'conducted' drives balance to 0,
        # triggering calculate_cashback and thus update_or_create.
        self.package = _make_package(self.student, balance=1)

        start = timezone.now() - timezone.timedelta(hours=1)
        self.slot = Slot.objects.create(
            teacher=self.teacher,
            start_time=start,
            end_time=start + timezone.timedelta(hours=1),
            status='booked',
        )
        self.lesson = Lesson.objects.create(
            slot=self.slot,
            student=self.student,
            package=self.package,
            status='scheduled',
        )
        # grade=9 → success_pct = round(9/10*100, 4) = 90.0 % → hits the 90 % tier
        # → earned_discount = 10 % ≠ 0 → update_or_create is reached
        JournalRecord.objects.create(lesson=self.lesson, activity_grade=9)

    def test_course_completion_failure_rolls_back_full_chain(self):
        """
        IntegrityError in CourseCompletion.update_or_create (simulated) must
        roll back: lesson.status stays 'scheduled', package.balance stays 1,
        and no CourseCompletion row exists in the DB.
        """
        self.client.force_authenticate(user=self.teacher_user)

        with patch.object(
            CourseCompletion.objects,
            'update_or_create',
            side_effect=IntegrityError('forced cashback error'),
        ):
            resp = self.client.patch(
                f'/api/v1/lessons/{self.lesson.pk}/status/',
                {'status': 'conducted'},
            )

        self.assertEqual(resp.status_code, 500)

        # lesson.status must NOT have changed
        self.lesson.refresh_from_db()
        self.assertEqual(self.lesson.status, 'scheduled')

        # package.balance must NOT have been decremented
        self.package.refresh_from_db()
        self.assertEqual(self.package.balance, 1)

        # No CourseCompletion must have been created
        self.assertFalse(
            CourseCompletion.objects.filter(student=self.student).exists()
        )


def _make_lesson_with_slot(teacher, student, package, hours_delta, status='conducted'):
    """Helper: creates a slot at now+hours_delta and a lesson with the given status."""
    start = timezone.now() + timezone.timedelta(hours=hours_delta)
    slot = Slot.objects.create(
        teacher=teacher,
        start_time=start,
        end_time=start + timezone.timedelta(hours=1),
        status='booked',
    )
    return Lesson.objects.create(
        slot=slot, student=student, package=package, status=status,
    )


def _make_conducted_lesson(teacher, student, package):
    """Helper: creates a booked slot + conducted lesson with a JournalRecord."""
    start = timezone.now() - timezone.timedelta(hours=2)
    slot = Slot.objects.create(
        teacher=teacher,
        start_time=start,
        end_time=start + timezone.timedelta(hours=1),
        status='booked',
    )
    lesson = Lesson.objects.create(
        slot=slot, student=student, package=package, status='conducted',
    )
    JournalRecord.objects.create(lesson=lesson)
    return lesson


class HomeworkGradeIntegrationTest(TestCase):
    """LEAR-75: Teacher grades student homework via PATCH /api/v1/lessons/{id}/homework/grade/"""

    def setUp(self):
        self.client = APIClient()

        self.teacher_user = _make_user('hg_teacher@test.test', 'Teacher')
        self.teacher = Teacher.objects.create(user=self.teacher_user)

        self.other_teacher_user = _make_user('hg_other@test.test', 'Teacher')
        self.other_teacher = Teacher.objects.create(user=self.other_teacher_user)

        self.student_user = _make_user('hg_student@test.test', 'Student')
        self.student = Student.objects.create(user=self.student_user)

        self.package = _make_package(self.student, balance=5)
        self.lesson = _make_conducted_lesson(self.teacher, self.student, self.package)

    def _url(self):
        return f'/api/v1/lessons/{self.lesson.pk}/homework/grade/'

    def test_teacher_grades_homework_successfully(self):
        """Teacher posts grade=8 → 200, JournalRecord.homework_grade == 8."""
        self.client.force_authenticate(user=self.teacher_user)
        resp = self.client.patch(self._url(), {'homework_grade': 8})
        self.assertEqual(resp.status_code, 200)
        record = JournalRecord.objects.get(lesson=self.lesson)
        self.assertEqual(record.homework_grade, 8)

    def test_student_cannot_grade_homework(self):
        """Student trying to grade → 403."""
        self.client.force_authenticate(user=self.student_user)
        resp = self.client.patch(self._url(), {'homework_grade': 7})
        self.assertEqual(resp.status_code, 403)

    def test_missing_grade_returns_400(self):
        """Empty payload (no homework_grade) → 400 with error message."""
        self.client.force_authenticate(user=self.teacher_user)
        resp = self.client.patch(self._url(), {})
        self.assertEqual(resp.status_code, 400)
        # custom_exception_handler wraps validation errors into {"errorCode": ..., "message": ...}
        self.assertEqual(resp.data['errorCode'], 'BAD_REQUEST')
        self.assertIn('homework_grade', resp.data['message'])


class StudentReportIntegrationTest(TestCase):
    """LEAR-84: GET /api/v1/student/report/ — two grade arrays with optional date filters."""

    URL = '/api/v1/student/report/'

    def setUp(self):
        self.client = APIClient()

        self.teacher_user = _make_user('sr_teacher@test.test', 'Teacher')
        self.teacher = Teacher.objects.create(user=self.teacher_user)

        self.student_user = _make_user('sr_student@test.test', 'Student')
        self.student = Student.objects.create(user=self.student_user)

        self.package = _make_package(self.student, balance=10)

        # lesson A — in the past (–48 h): grade=8
        self.lesson_a = _make_lesson_with_slot(self.teacher, self.student, self.package, hours_delta=-48)
        self.record_a = JournalRecord.objects.create(lesson=self.lesson_a, grade=8)

        # lesson B — recent (–2 h): homework_grade=9
        self.lesson_b = _make_lesson_with_slot(self.teacher, self.student, self.package, hours_delta=-2)
        self.record_b = JournalRecord.objects.create(lesson=self.lesson_b, homework_grade=9)

    def test_two_lessons_appear_in_correct_arrays(self):
        """grade=8 → lesson_grades[0], homework_grade=9 → homework_grades[0]."""
        self.client.force_authenticate(user=self.student_user)
        resp = self.client.get(self.URL)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data['lesson_grades']), 1)
        self.assertEqual(resp.data['lesson_grades'][0]['grade'], 8)
        self.assertEqual(resp.data['lesson_grades'][0]['lesson_id'], self.lesson_a.pk)
        self.assertEqual(len(resp.data['homework_grades']), 1)
        self.assertEqual(resp.data['homework_grades'][0]['grade'], 9)
        self.assertEqual(resp.data['homework_grades'][0]['lesson_id'], self.lesson_b.pk)

    def test_start_date_filter_cuts_old_lesson(self):
        """?start_date=today → lesson_a (-48 h) is excluded, lesson_b (-2 h) remains."""
        self.client.force_authenticate(user=self.student_user)
        today = timezone.now().date().isoformat()
        resp = self.client.get(self.URL, {'start_date': today})
        self.assertEqual(resp.status_code, 200)
        # lesson_a was 2 days ago — must be filtered out
        self.assertEqual(len(resp.data['lesson_grades']), 0)
        # lesson_b was today — must still appear
        self.assertEqual(len(resp.data['homework_grades']), 1)

    def test_teacher_gets_403(self):
        """Teacher cannot access student report."""
        self.client.force_authenticate(user=self.teacher_user)
        resp = self.client.get(self.URL)
        self.assertEqual(resp.status_code, 403)

    def test_empty_report_returns_empty_arrays(self):
        """Student with no journal records gets 200 + both arrays empty."""
        new_student_user = _make_user('sr_empty@test.test', 'Student')
        new_student = Student.objects.create(user=new_student_user)
        self.client.force_authenticate(user=new_student_user)
        resp = self.client.get(self.URL)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['lesson_grades'], [])
        self.assertEqual(resp.data['homework_grades'], [])
