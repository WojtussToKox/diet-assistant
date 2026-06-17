from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Informacje o diecie i roli', {
            'fields': ('role', 'dietitian')
        }),
        ('Cechy fizyczne', {
            'fields': ('date_of_birth', 'gender', 'height_cm', 'weight_kg')
        }),
    )
    
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_staff')
    
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active', 'groups')

admin.site.register(User, UserAdmin)
