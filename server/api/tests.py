from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from unittest.mock import patch, MagicMock
from api.models import RegistrationRequest
from api.views import generate_password, RegistrationRequestView, ActivatePackageView, StudentBalanceView


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