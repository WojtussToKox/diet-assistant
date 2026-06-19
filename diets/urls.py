from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import RecipeViewSet, DietPlanViewSet, DailyMenuViewSet, ScheduledMealViewSet, DietPlanBuilderView

router = DefaultRouter()
router.register('recipes', RecipeViewSet, basename='recipe')
router.register('diet-plans', DietPlanViewSet, basename='diet-plan')
router.register('daily-menus', DailyMenuViewSet, basename='daily-menu')
router.register('scheduled-meals', ScheduledMealViewSet, basename='scheduled-meal')

urlpatterns = [
    path('diet-plans/bulk-create/', DietPlanBuilderView.as_view(), name='bulk-create-plan'),
    path('diet-plans/<int:plan_id>/bulk-update/', DietPlanBuilderView.as_view(), name='bulk-update-plan'),
] + router.urls