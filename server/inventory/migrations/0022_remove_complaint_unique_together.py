from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0021_add_complaint_accepted_rejected_status'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='complaint',
            unique_together=set(),
        ),
    ]
