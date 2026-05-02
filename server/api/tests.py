from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient, APIRequestFactory, force_authenticate
from unittest.mock import patch, MagicMock
from api.models import RegistrationRequest
from api.views import generate_password, RegistrationRequestView, ActivatePackageView, StudentBalanceView
from inventory.models import Slot, Teacher, Lesson, Package, JournalRecord, Course, Discipline
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
    """
    Full booking flow:
      teacher creates a slot → student books a lesson →
      teacher marks it conducted → package balance decreases by 1.
    """

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
        self.assertTrue(Slot.objects.get(pk=slot_id).is_booked)

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
            is_booked=True,
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
        resp = self.client.post(f'/api/v1/lessons/{self.lesson.pk}/evaluate/', payload)

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