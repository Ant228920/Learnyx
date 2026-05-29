from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Q
from users.models import User, Student, Teacher, Manager, Role
from inventory.models import Package, Slot

class Command(BaseCommand):
    help = 'Аудит цілісності бази даних: пошук аномалій, сирітських записів та логічних помилок.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('=== Запуск аудиту цілісності БД Learnyx ===\n'))
        
        errors_found = 0

        # 1. Перевірка користувачів без ролей
        self.stdout.write('1. Перевірка користувачів...')
        users_without_roles = User.objects.filter(Q(role_obj__isnull=True))
        if users_without_roles.exists():
            for u in users_without_roles:
                self.stdout.write(self.style.ERROR(f'  [АНОМАЛІЯ] Користувач {u.email} (ID: {u.id}) не має прив\'язаної ролі!'))
                errors_found += 1
        else:
            self.stdout.write(self.style.SUCCESS(' Усі користувачі мають ролі.'))

        # 2. Аномалії у профілях (сирітські записи)
        self.stdout.write('\n2. Перевірка профілів студентів/викладачів/менеджерів...')
        
        # Використовуємо exclude(id__in=...) щоб уникнути помилок з related_name
        students_without_profile = User.objects.filter(role_obj__name='Student').exclude(id__in=Student.objects.values('user_id'))
        teachers_without_profile = User.objects.filter(role_obj__name='Teacher').exclude(id__in=Teacher.objects.values('user_id'))
        managers_without_profile = User.objects.filter(role_obj__name='Manager').exclude(id__in=Manager.objects.values('user_id'))
        
        if students_without_profile.exists():
            for u in students_without_profile:
                self.stdout.write(self.style.ERROR(f'  [СИРОТА] Користувач {u.email} має роль Student, але не має профілю Student!'))
                errors_found += 1
                
        if teachers_without_profile.exists():
            for u in teachers_without_profile:
                self.stdout.write(self.style.ERROR(f'  [СИРОТА] Користувач {u.email} має роль Teacher, але не має профілю Teacher!'))
                errors_found += 1
                
        if managers_without_profile.exists():
            for u in managers_without_profile:
                self.stdout.write(self.style.ERROR(f'  [СИРОТА] Користувач {u.email} має роль Manager, але не має профілю Manager!'))
                errors_found += 1

        if not any([students_without_profile.exists(), teachers_without_profile.exists(), managers_without_profile.exists()]):
            self.stdout.write(self.style.SUCCESS('  Усі користувачі мають відповідні профілі згідно з ролями.'))

        # 3. Відповідність фінансових балансів пакетам
        self.stdout.write('\n3. Перевірка пакетів та балансів...')
        invalid_packages = Package.objects.filter(balance__lt=0)
        if invalid_packages.exists():
            for p in invalid_packages:
                self.stdout.write(self.style.ERROR(f'  [МІНУСОВИЙ БАЛАНС] Пакет ID:{p.id} (Студент: {p.student}) має від\'ємний баланс: {p.balance}'))
                errors_found += 1
        else:
            self.stdout.write(self.style.SUCCESS('  Немає пакетів з від\'ємним балансом.'))
            
        active_packages_zero_balance = Package.objects.filter(status='active', balance=0)
        if active_packages_zero_balance.exists():
            for p in active_packages_zero_balance:
                self.stdout.write(self.style.WARNING(f'  [ЛОГІКА] Пакет ID:{p.id} активний, але баланс уроків = 0.'))
                errors_found += 1

        # 4. Застарілі статуси слотів
        self.stdout.write('\n4. Перевірка слотів розкладу...')
        now = timezone.now()
        stale_slots = Slot.objects.filter(status='available', start_time__lt=now)
        if stale_slots.exists():
            self.stdout.write(self.style.WARNING(f'  [ЗАСТАРІЛЕ] Знайдено {stale_slots.count()} слотів зі статусом "available" у минулому.'))
            errors_found += 1
        else:
             self.stdout.write(self.style.SUCCESS('  Застарілих вільних слотів не знайдено.'))

        # Підсумок
        self.stdout.write('\n' + '='*40)
        if errors_found == 0:
            self.stdout.write(self.style.SUCCESS('АУДИТ ПРОЙДЕНО УСПІШНО! База даних в ідеальному стані.'))
        else:
            self.stdout.write(self.style.ERROR(f'АУДИТ ЗАВЕРШЕНО. Знайдено проблем/аномалій: {errors_found}. Рекомендується ручна перевірка.'))