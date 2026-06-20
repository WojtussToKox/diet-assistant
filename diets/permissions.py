from rest_framework import permissions

class CanManageDietPlan(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.role in ['DIETITIAN', 'STANDARD'])

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        if hasattr(obj, 'dietitian'):
            return obj.dietitian == user
        return True


class CanManageRecipe(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        if hasattr(obj, 'author'):
            return obj.author == request.user
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user

        return True