import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0017_alter_learningrequest_level'),
    ]

    operations = [
        migrations.AlterField(
            model_name='package',
            name='course',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to='inventory.course',
            ),
        ),
    ]
