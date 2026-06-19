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