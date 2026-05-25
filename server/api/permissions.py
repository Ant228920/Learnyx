from rest_framework.permissions import BasePermission


def _role(user) -> str:
    """Return the user's role name in lowercase, or empty string if unavailable."""
    if not user or not user.is_authenticated:
        return ''
    role_obj = getattr(user, 'role_obj', None)
    if not role_obj:
        return ''
    return getattr(role_obj, 'name', '').lower()


class IsTeacher(BasePermission):
    def has_permission(self, request, view):
        return _role(request.user) == 'teacher'


class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return _role(request.user) == 'student'


class IsManager(BasePermission):
    def has_permission(self, request, view):
        return _role(request.user) in ('manager', 'admin')
