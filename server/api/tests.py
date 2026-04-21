from django.test import TestCase
from unittest.mock import patch, MagicMock
from api.models import RegistrationRequest
from api.views import generate_password


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
