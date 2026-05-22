import os
from django.core.exceptions import ValidationError

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.png', '.jpg', '.jpeg', '.pptx'}


def validate_file_size(value):
    if value.size > MAX_FILE_SIZE:
        raise ValidationError(
            f'Файл завеликий: {value.size // (1024 * 1024)} МБ. Максимум — 10 МБ.'
        )


def validate_file_extension(value):
    ext = os.path.splitext(value.name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        allowed = ', '.join(sorted(ALLOWED_EXTENSIONS))
        raise ValidationError(
            f'Недозволений формат "{ext}". Дозволені: {allowed}.'
        )
