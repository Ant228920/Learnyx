from django.core.management.base import BaseCommand
from users.models import Student
from inventory.models import Package

class Command(BaseCommand):
    help = 'Аудит цілісності бази даних (Integrity Audit)'

    def handle(self, *args, **kwargs):
        self.stdout.write("Починаємо аудит цілісності бази даних...\n")

        # --- Перевірка 1: Чи є студенти з від'ємним балансом (до того, як ми додали Hotfix) ---
        negative_students = Student.objects.filter(money_balance__lt=0)
        if negative_students.exists():
            self.stdout.write(self.style.ERROR(f"Порушення: Знайдено {negative_students.count()} студентів з від'ємним балансом!"))
            for st in negative_students:
                self.stdout.write(f"   - Студент ID {st.id}, Баланс: {st.money_balance}")
        else:
            self.stdout.write(self.style.SUCCESS("Фінансова цілісність: Усі баланси студентів коректні (>= 0)."))

        # --- Перевірка 2: "Сирітські" або логічно зламані записи ---
        # Наприклад, Пакет має статус 'active', але на балансі 0 уроків (зомбі-пакет)
        zombie_packages = Package.objects.filter(status='active', balance=0)
        if zombie_packages.exists():
            self.stdout.write(self.style.ERROR(f"Порушення зв'язків: Знайдено {zombie_packages.count()} 'зомбі' пакетів (активні, але 0 уроків)!"))
            for pkg in zombie_packages:
                # Безпечно отримуємо email користувача, щоб не впасти, якщо юзера випадково видалили
                user_email = pkg.student.user.email if hasattr(pkg.student, 'user') else "Невідомий (Сирота)"
                self.stdout.write(f"   - Пакет ID {pkg.id}, Студент: {user_email}")
        else:
            self.stdout.write(self.style.SUCCESS("Логічна цілісність: Зомбі-пакетів не знайдено."))

        self.stdout.write("\nАудит завершено.")
