from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0020_package_low_balance_notified'),
    ]

    operations = [
        migrations.AlterField(
            model_name='complaint',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending', 'Pending'),
                    ('accepted', 'Accepted'),
                    ('rejected', 'Rejected'),
                    ('reviewed', 'Reviewed'),
                ],
                default='pending',
                max_length=20,
            ),
        ),
    ]
