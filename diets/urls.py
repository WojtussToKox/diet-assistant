from rest_framework.routers import DefaultRouter
from .views import RecipeViewSet, DietPlanViewSet, DailyMenuViewSet, ScheduledMealViewSet

router = DefaultRouter()
router.register('recipes', RecipeViewSet, basename='recipe')
router.register('diet-plans', DietPlanViewSet, basename='diet-plan')
router.register('daily-menus', DailyMenuViewSet, basename='daily-menu')
router.register('scheduled-meals', ScheduledMealViewSet, basename='scheduled-meal')

urlpatterns = router.urls