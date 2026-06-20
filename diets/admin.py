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
    # CHANGED: 'day_number' to 'day_of_week'
    fields = ['day_of_week']

@admin.register(DietPlan)
class DietPlanAdmin(admin.ModelAdmin):
    # CHANGED: Removed 'start_date' and 'end_date', added 'daily_calories_goal'
    list_display = ['name', 'patient', 'dietitian', 'daily_calories_goal']
    inlines = [DailyMenuInline]
    exclude = ['dietitian']

    def save_model(self, request, obj, form, change):
        if not change:
            obj.dietitian = request.user
        super().save_model(request, obj, form, change)


class ScheduledMealInline(admin.TabularInline):
    model = ScheduledMeal
    extra = 3
    autocomplete_fields = ['recipe']

@admin.register(DailyMenu)
class DailyMenuAdmin(admin.ModelAdmin):
    # CHANGED: 'day_number' to 'day_of_week'
    list_display = ['__str__', 'diet_plan', 'day_of_week']
    list_filter = ['diet_plan']
    inlines = [ScheduledMealInline]