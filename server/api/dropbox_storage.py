import logging
import dropbox
from functools import lru_cache
from django.conf import settings
from dropbox.files import WriteMode

LEARNYX_ROOT = "/learnyx"

logger = logging.getLogger(__name__)


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


def _share_folder_with_email(folder_path: str, email: str):
    dbx = get_dbx()
    try:
        launch = dbx.sharing_share_folder(folder_path, force_async=False)
        if launch.is_complete():
            shared_folder_id = launch.get_complete().shared_folder_id
        else:
            meta = dbx.sharing_get_folder_metadata(folder_path)
            shared_folder_id = meta.shared_folder_id

        from dropbox.sharing import AddMember, MemberSelector, AccessLevel
        dbx.sharing_add_folder_member(
            shared_folder_id,
            members=[
                AddMember(
                    member=MemberSelector.email(email),
                    access_level=AccessLevel.viewer,
                )
            ],
            quiet=False,
        )
    except Exception as e:
        logger.warning(f'Dropbox share invite failed: {e}')


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


def upload_lesson_material(lesson_id: int, file, notify_email: str = None) -> str:
    # Dropbox sharing endpoints reject multi-segment folder paths for share-link
    # creation — flatten to a single segment under root.
    folder = f"{LEARNYX_ROOT}_lessons_{lesson_id}_materials"
    path = f"{folder}/{file.name}"
    ensure_folder(folder)
    url = upload_file(file, path)
    if notify_email:
        _share_folder_with_email(folder, notify_email)
    return url


def upload_homework_file(lesson_id: int, student_id: int, file, notify_email: str = None) -> str:
    # Dropbox sharing endpoints reject multi-segment folder paths for share-link
    # creation — flatten to a single segment under root.
    folder = f"{LEARNYX_ROOT}_lessons_{lesson_id}_homework"
    path = f"{folder}/{student_id}_{file.name}"
    ensure_folder(folder)
    url = upload_file(file, path)
    if notify_email:
        _share_folder_with_email(folder, notify_email)
    return url
