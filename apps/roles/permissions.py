from rest_framework import permissions

def user_has_permission(user, module, action):
    """Check if user has explicit permission or is superuser/superadmin"""
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    if hasattr(user, 'role') and user.role:
        if user.role.code == 'SUPERADMINISTRADOR':
            return True
        codename = f"{module}_{action}"
        return user.role.role_permissions.filter(permission__codename=codename).exists()
    return False

class HasModulePermission(permissions.BasePermission):
    """
    DRF Permission class:
    Checks if the user has permission for the module and corresponding action (GET -> view, POST -> create, PUT/PATCH -> edit, DELETE -> delete)
    """
    module = None
    required_action = None

    def __init__(self, module=None, action=None):
        if module:
            self.module = module
        if action:
            self.required_action = action

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True

        module = getattr(view, 'permission_module', self.module)
        if not module:
            return True

        action = self.required_action
        if not action:
            if request.method in permissions.SAFE_METHODS:
                action = 'view'
            elif request.method == 'POST':
                action = 'create'
            elif request.method in ('PUT', 'PATCH'):
                action = 'edit'
            elif request.method == 'DELETE':
                action = 'delete'
            else:
                action = 'view'

        return user_has_permission(request.user, module, action)
