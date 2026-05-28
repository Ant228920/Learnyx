from django.core.management.base import BaseCommand
from django.db.models import F
from django.utils import timezone
from users.models import User, Student
from inventory.models import Package, Slot

class Command(BaseCommand):
    help = 'Integrity Audit: Шукає логічні помилки, порушені зв\'язки та сирітські записи в БД.'

    def handle(self, *args, **kwargs):
        self.stdout.write("Починаємо Integrity Audit...\n")
        issues_found = 0

        # --- 1. ПЕРЕВІРКА КОРИСТУВАЧІВ ТА РОЛЕЙ (Orphan Records) ---
        # Шукаємо юзерів, які не мають призначеної ролі
        users_without_role = User.objects.filter(role_obj__isnull=True).count()
        if users_without_role > 0:
            self.stdout.write(self.style.WARNING(f" Знайдено {users_without_role} користувачів без призначеної ролі."))
            issues_found += 1

        # Шукаємо студентів, у яких немає прив'язаного User (аномалія бази)
        # Або юзерів з роллю "Student", але без створеного профілю Student
        students_without_profile = User.objects.filter(role_obj__name__iexact='student', student_profile__isnull=True).count()
        if students_without_profile > 0:
            self.stdout.write(self.style.ERROR(f" Аномалія: {students_without_profile} юзерів мають роль 'Student', але не мають профілю в таблиці Student!"))
            issues_found += 1


        # --- 2. ПЕРЕВІРКА ФІНАНСОВОЇ ТА БІЗНЕС-ЛОГІКИ (Data Consistency) ---
        # Шукаємо пакети, де залишок уроків (balance) більший, ніж взагалі було куплено (total_lessons)
        invalid_packages = Package.objects.filter(balance__gt=F('total_lessons')).count()
        if invalid_packages > 0:
            self.stdout.write(self.style.ERROR(f" Аномалія: {invalid_packages} пакетів мають баланс більший за початкову кількість уроків!"))
            issues_found += 1


        # --- 3. ПЕРЕВІРКА "ЗАВИСЛИХ" СТАТУСІВ (Stale Data) ---
        # Шукаємо слоти вчителів, які вже минули в часі, але досі висять у статусі "available" (вільні)
        now = timezone.now()
        stale_slots = Slot.objects.filter(start_time__lt=now, status='available').count()
        if stale_slots > 0:
            self.stdout.write(self.style.WARNING(f"⚠️ Знайдено {stale_slots} протермінованих слотів, які досі мають статус 'Available'."))
            issues_found += 1


        # --- ПІДСУМОК ---
        self.stdout.write("-" * 40)
        if issues_found == 0:
            self.stdout.write(self.style.SUCCESS(" Integrity Audit пройдено успішно! База даних у ідеальному стані."))
        else:
            self.stdout.write(self.style.ERROR(f" Аудит виявив проблеми у {issues_found} категоріях. Потрібне втручання розробника."))