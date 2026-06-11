import base64
import logging
import posixpath
import uuid

import dropbox
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible
from dropbox.exceptions import ApiError
from dropbox.files import WriteMode

logger = logging.getLogger(__name__)


@deconstructible
class DropboxStorage(Storage):
    """Django-compatible storage backend + base64 upload utility."""

    def __init__(self, root='/learnyx'):
        self.root = root
        self._client = None

    # ── Django Storage interface ─────────────────────────────────────────────

    @property
    def client(self):
        if self._client is None:
            self._client = self.get_client()
        return self._client

    def _full_path(self, name):
        path = posixpath.join(self.root, name.replace('\\', '/'))
        return path if path.startswith('/') else '/' + path

    def _save(self, name, content):
        full = self._full_path(name)
        self.client.files_upload(content.read(), full, mode=WriteMode.overwrite, autorename=False)
        return name

    def _open(self, name, mode='rb'):
        _, response = self.client.files_download(self._full_path(name))
        return ContentFile(response.content)

    def exists(self, name):
        try:
            self.client.files_get_metadata(self._full_path(name))
            return True
        except ApiError:
            return False

    def delete(self, name):
        try:
            self.client.files_delete_v2(self._full_path(name))
        except ApiError:
            pass

    def size(self, name):
        return self.client.files_get_metadata(self._full_path(name)).size

    def url(self, name):
        full = self._full_path(name)
        try:
            links = self.client.sharing_list_shared_links(path=full, direct_only=True)
            if links.links:
                link = links.links[0].url
            else:
                shared = self.client.sharing_create_shared_link_with_settings(full)
                link = shared.url
            return link  # keep ?dl=0 for preview; frontend converts as needed
        except ApiError:
            return ''

    def get_available_name(self, name, max_length=None):
        return name

    # ── Base64 upload utility ────────────────────────────────────────────────

    def get_client(self):
        refresh_token = getattr(settings, 'DROPBOX_REFRESH_TOKEN', '') or ''
        app_key = getattr(settings, 'DROPBOX_APP_KEY', '') or ''
        app_secret = getattr(settings, 'DROPBOX_APP_SECRET', '') or ''
        if not refresh_token or not app_key:
            logger.warning('Dropbox credentials missing — DROPBOX_REFRESH_TOKEN or DROPBOX_APP_KEY not set')
            return None
        try:
            return dropbox.Dropbox(
                oauth2_refresh_token=refresh_token,
                app_key=app_key,
                app_secret=app_secret,
            )
        except Exception as e:
            logger.error(f'Dropbox client init failed: {e}')
            return None

    def upload(self, file_data: str, filename: str, folder: str = '/learnyx') -> str:
        """Upload a base64 data URI to Dropbox. Returns a direct download URL or '' on failure."""
        if not file_data:
            return ''

        dbx = self.get_client()
        if not dbx:
            return ''

        try:
            if ',' in file_data:
                _, encoded = file_data.split(',', 1)
            else:
                encoded = file_data

            file_bytes = base64.b64decode(encoded)
            ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else 'pdf'
            unique_path = f"{folder}/{uuid.uuid4().hex}.{ext}"

            dbx.files_upload(file_bytes, unique_path, mode=WriteMode.overwrite)

            try:
                shared = dbx.sharing_create_shared_link_with_settings(unique_path)
                url = shared.url
            except ApiError:
                links = dbx.sharing_list_shared_links(path=unique_path, direct_only=True)
                url = links.links[0].url if links.links else ''

            return url  # keep ?dl=0 — frontend converts to direct URL for viewing

        except Exception as e:
            logger.error(f'Dropbox upload error: {e}')
            return ''
