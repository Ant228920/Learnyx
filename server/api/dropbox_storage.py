import dropbox
from functools import lru_cache
from django.conf import settings
from dropbox.files import WriteMode

LEARNYX_ROOT = "/learnyx"


@lru_cache(maxsize=1)
def get_dbx():
    return dropbox.Dropbox(
        oauth2_refresh_token=settings.DROPBOX_REFRESH_TOKEN,
        app_key=settings.DROPBOX_APP_KEY,
        app_secret=settings.DROPBOX_APP_SECRET,
    )


def ensure_folder(path: str):
    try:
        get_dbx().files_create_folder_v2(path)
    except dropbox.exceptions.ApiError as e:
        err = e.error
        if hasattr(err, 'get_path') and err.get_path().is_conflict():
            pass  # folder already exists
        else:
            raise


def upload_file(file, dropbox_path: str) -> str:
    dbx = get_dbx()
    dbx.files_upload(file.read(), dropbox_path, mode=WriteMode.overwrite)
    try:
        shared = dbx.sharing_create_shared_link_with_settings(dropbox_path)
        link = shared.url
    except dropbox.exceptions.ApiError:
        links = dbx.sharing_list_shared_links(path=dropbox_path, direct_only=True)
        link = links.links[0].url if links.links else ''
    return link.replace("www.dropbox.com", "dl.dropboxusercontent.com").replace("?dl=0", "")


def upload_lesson_material(lesson_id: int, file) -> str:
    path = f"{LEARNYX_ROOT}/lessons/{lesson_id}/materials/{file.name}"
    ensure_folder(f"{LEARNYX_ROOT}/lessons/{lesson_id}/materials")
    return upload_file(file, path)


def upload_homework_file(lesson_id: int, student_id: int, file) -> str:
    path = f"{LEARNYX_ROOT}/lessons/{lesson_id}/homework/{student_id}_{file.name}"
    ensure_folder(f"{LEARNYX_ROOT}/lessons/{lesson_id}/homework")
    return upload_file(file, path)
