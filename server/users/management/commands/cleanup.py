from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

# Імпортуємо наші моделі
from users.models import User
from inventory.models import LearningRequest

class Command(BaseCommand):
    help = 'Очищає базу даних від тестового сміття (Data Cleanup)'

    def handle(self, *args, **kwargs):
        self.stdout.write("Починаємо очищення бази даних...")

        # Вираховуємо точну дату "30 днів тому" від поточного моменту
        thirty_days_ago = timezone.now() - timedelta(days=30)

        # 1. Видаляємо всіх користувачів, створених для тестів (наприклад, з доменом @test.com)
        # Метод delete() повертає кількість видалених записів
        users_deleted_count, _ = User.objects.filter(email__contains='@test.com').delete()
        self.stdout.write(self.style.SUCCESS(f"✅ Видалено тестових користувачів: {users_deleted_count}"))

        # 2. Видаляємо старі заявки, які "зависли" в статусі pending більше 30 днів
        requests_deleted_count, _ = LearningRequest.objects.filter(
            status='pending', 
            created_at__lt=thirty_days_ago
        ).delete()
        self.stdout.write(self.style.SUCCESS(f"✅ Видалено старих заявок: {requests_deleted_count}"))

        self.stdout.write(self.style.SUCCESS('🎉 Очищення бази даних успішно завершено!'))