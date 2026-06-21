from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, DietitianRequest

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Role and Assignments', {
            'fields': ('role', 'dietitian')
        }),
        ('Physical data', {
            'fields': ('date_of_birth', 'gender', 'height_cm', 'weight_kg')
        }),
    )
    list_display = ('username', 'email', 'first_name', 'role', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_active')
    list_editable = ('role',)
    search_fields = ('username', 'email', 'first_name')

@admin.register(DietitianRequest)
class DietitianRequestAdmin(admin.ModelAdmin):
    list_display = ('patient', 'dietitian', 'status', 'created_at')
    list_filter = ('status',)