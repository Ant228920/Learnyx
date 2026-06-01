from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0018_alter_package_course_nullable'),
    ]

    operations = [
        migrations.AddField(
            model_name='journalrecord',
            name='lesson_topic',
            field=models.CharField(blank=True, max_length=500, null=True),
        ),
        migrations.AlterField(
            model_name='journalrecord',
            name='homework_file_url',
            field=models.TextField(blank=True, null=True),
        ),
    ]
