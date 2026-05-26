import posixpath

import dropbox
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible
from dropbox.exceptions import ApiError
from dropbox.files import WriteMode


@deconstructible
class DropboxStorage(Storage):
    def __init__(self, root="/learnyx"):
        self.root = root
        self._client = None

    @property
    def client(self):
        if self._client is None and settings.DROPBOX_REFRESH_TOKEN:
            self._client = dropbox.Dropbox(
                oauth2_refresh_token=settings.DROPBOX_REFRESH_TOKEN,
                app_key=settings.DROPBOX_APP_KEY,
                app_secret=settings.DROPBOX_APP_SECRET,
            )
        return self._client

    def _full_path(self, name):
        path = posixpath.join(self.root, name.replace("\\", "/"))
        if not path.startswith("/"):
            path = "/" + path
        return path

    def _save(self, name, content):
        full = self._full_path(name)
        self.client.files_upload(
            content.read(),
            full,
            mode=WriteMode.overwrite,
            autorename=False,
        )
        return name

    def _open(self, name, mode="rb"):
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
        meta = self.client.files_get_metadata(self._full_path(name))
        return meta.size

    def url(self, name):
        full = self._full_path(name)
        try:
            links = self.client.sharing_list_shared_links(path=full, direct_only=True)
            if links.links:
                link = links.links[0].url
            else:
                shared = self.client.sharing_create_shared_link_with_settings(full)
                link = shared.url
            return link.replace("?dl=0", "?raw=1")
        except ApiError:
            return ""

    def get_available_name(self, name, max_length=None):
        return name
