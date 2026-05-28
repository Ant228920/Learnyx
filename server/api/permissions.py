from rest_framework.permissions import BasePermission


<<<<<<< HEAD
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
=======
class IsTeacher(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role_obj
            and request.user.role_obj.name.lower() == 'teacher'
        )
>>>>>>> 9eb61c56c0ee2f61c17f17c3b112086ca969d621


class IsStudent(BasePermission):
    def has_permission(self, request, view):
<<<<<<< HEAD
        return _role(request.user) == 'student'
=======
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role_obj
            and request.user.role_obj.name.lower() == 'student'
        )
>>>>>>> 9eb61c56c0ee2f61c17f17c3b112086ca969d621


class IsManager(BasePermission):
    def has_permission(self, request, view):
<<<<<<< HEAD
        return _role(request.user) in ('manager', 'admin')
=======
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role_obj
            and request.user.role_obj.name.lower() == 'manager'
        )
>>>>>>> 9eb61c56c0ee2f61c17f17c3b112086ca969d621
