from django.core.management.base import BaseCommand
from users.models import Role, StudentLevel, TeacherLevel, User

class Command(BaseCommand):
    help = 'Наповнює базу даних стартовими (seed) даними'

    def handle(self, *args, **kwargs):
        self.stdout.write("Починаємо завантаження Seed-даних...")

        # 1. Створюємо базові ролі
        roles = ['Student', 'Teacher', 'Manager']
        for role_name in roles:
            Role.objects.get_or_create(name=role_name)
        self.stdout.write(self.style.SUCCESS('✅ Ролі успішно створені'))

        # 2. Створюємо рівні для студентів
        student_levels = ['Бакалавр', 'Магістр', 'Аспірант']
        for level in student_levels:
            StudentLevel.objects.get_or_create(name=level)
        self.stdout.write(self.style.SUCCESS('✅ Рівні студентів успішно створені'))

        # 3. Створюємо рівні для викладачів
        teacher_levels = ['Асистент', 'Доцент', 'Професор']
        for level in teacher_levels:
            TeacherLevel.objects.get_or_create(name=level)
        self.stdout.write(self.style.SUCCESS('✅ Рівні викладачів успішно створені'))

        # 4. Створюємо головного Супер-Адміна (Менеджера)
        manager_role = Role.objects.get(name='Manager')
        
        # ВИПРАВЛЕНО: тепер перевіряємо по username, а не по email
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@learnyx.com',
                password='adminpassword123',
                role_obj=manager_role,
                first_name='Головний',
                last_name='Адміністратор'
            )
            self.stdout.write(self.style.SUCCESS('✅ Суперкористувач (admin) створений'))
        else:
            self.stdout.write(self.style.WARNING('⚠️ Суперкористувач "admin" вже існує. Пропускаємо.'))

        self.stdout.write(self.style.SUCCESS('🎉 База даних успішно просідована!'))