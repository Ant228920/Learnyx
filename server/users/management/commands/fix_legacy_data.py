from django.core.management.base import BaseCommand
from django.db import transaction
from users.models import User, Student
from inventory.models import Package, CourseCompletion

class Command(BaseCommand):
    help = 'Фікс кривих даних (Data Consistency Fixes) перед релізом RC'

    def handle(self, *args, **kwargs):
        self.stdout.write("Починаємо глобальне виправлення даних (Data Cleaning)...")

        # Використовуємо transaction.atomic(), щоб у разі помилки база відкотилася назад
        with transaction.atomic():

            # ---------------------------------------------------------
            # 1. Фікс фінансів: Від'ємні баланси студентів
            # ---------------------------------------------------------
            # Баг: Через відсутність перевірок баланс міг піти в мінус
            # Рішення: Всі від'ємні баланси обнуляємо.
            students_fixed = Student.objects.filter(money_balance__lt=0).update(money_balance=0)
            self.stdout.write(f"1. Виправлено від'ємних балансів студентів: {students_fixed}")

            # ---------------------------------------------------------
            # 2. Фікс користувачів: Криві Emails та Телефони
            # ---------------------------------------------------------
            # Баг: " John@Gmail.com " та "+38 (050) 123-45"
            # Рішення: Зводимо до john@gmail.com та +3805012345
            users_to_fix = []
            for user in User.objects.all():
                needs_update = False

                if user.email:
                    clean_email = user.email.strip().lower()
                    if user.email != clean_email:
                        user.email = clean_email
                        needs_update = True

                if user.phone:
                    clean_phone = ''.join(char for char in user.phone if char.isdigit() or char == '+')
                    if user.phone != clean_phone:
                        user.phone = clean_phone
                        needs_update = True

                if needs_update:
                    users_to_fix.append(user)

            if users_to_fix:
                User.objects.bulk_update(users_to_fix, ['email', 'phone'])
            self.stdout.write(f"2. Нормалізовано контактні дані користувачів: {len(users_to_fix)}")

            # ---------------------------------------------------------
            # 3. Фікс пакетів: Математична точність та залишок уроків
            # ---------------------------------------------------------
            # Баг: Ціни з рухомою комою та баланс > загальної кількості уроків
            packages_to_fix = []
            for pkg in Package.objects.all():
                needs_update = False

                # Фікс точності ціни
                if pkg.final_price:
                    rounded_price = round(float(pkg.final_price), 2)
                    if float(pkg.final_price) != rounded_price:
                        pkg.final_price = rounded_price
                        needs_update = True

                # Фікс логічного парадоксу балансу
                if pkg.balance < 0:
                    pkg.balance = 0
                    needs_update = True
                elif pkg.balance > pkg.total_lessons:
                    pkg.balance = pkg.total_lessons
                    needs_update = True

                if needs_update:
                    packages_to_fix.append(pkg)

            if packages_to_fix:
                Package.objects.bulk_update(packages_to_fix, ['final_price', 'balance'])
            self.stdout.write(f"3. Виправлено пакетів (ціна/логіка балансу): {len(packages_to_fix)}")

            # ---------------------------------------------------------
            # 4. Фікс бонусів: Кешбек вийшов за межі реального
            # ---------------------------------------------------------
            # Баг: Хтось випадково нарахував студенту 150% знижки
            # Рішення: Обрізаємо все, що більше 100% або менше 0%
            invalid_discounts_high = CourseCompletion.objects.filter(earned_discount__gt=100).update(earned_discount=100)
            invalid_discounts_low = CourseCompletion.objects.filter(earned_discount__lt=0).update(earned_discount=0)
            total_discounts_fixed = invalid_discounts_high + invalid_discounts_low
            self.stdout.write(f"4. Виправлено кривих знижок (CourseCompletion): {total_discounts_fixed}")

        self.stdout.write(self.style.SUCCESS("\nУсі 'криві' дані успішно виправлені! База даних готова до Schema Freezing та релізу."))
