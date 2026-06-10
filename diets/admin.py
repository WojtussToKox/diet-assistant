from django.contrib import admin
from .models import Recipe, RecipeIngredient, DietPlan, DailyMenu, ScheduledMeal

class RecipeIngredientInline(admin.TabularInline):
    model = RecipeIngredient
    extra = 1

@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    inlines = [RecipeIngredientInline]
    search_fields = ['name']

class DailyMenuInline(admin.TabularInline):
    model = DailyMenu
    extra = 7
    fields = ['day_number']

@admin.register(DietPlan)
class DietPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'patient', 'dietitian', 'start_date', 'end_date']
    inlines = [DailyMenuInline]

class ScheduledMealInline(admin.TabularInline):
    model = ScheduledMeal
    extra = 3
    autocomplete_fields = ['recipe']

@admin.register(DailyMenu)
class DailyMenuAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'diet_plan', 'day_number']
    list_filter = ['diet_plan']
    inlines = [ScheduledMealInline]