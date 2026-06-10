from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from .models import Recipe, DietPlan, DailyMenu, ScheduledMeal
from .serializers import (
    RecipeListSerializer,
    RecipeDetailSerializer,
    DietPlanListSerializer,
    DietPlanDetailSerializer,
    DailyMenuListSerializer,
    DailyMenuDetailSerializer,
    ScheduledMealSerializer,
)


class MixedSerializerMixin(viewsets.ModelViewSet):
    list_serializer_class = None
    detail_serializer_class = None

    def get_serializer_class(self):
        if self.action == 'list':
            return self.list_serializer_class
        return self.detail_serializer_class


class RecipeViewSet(MixedSerializerMixin, viewsets.ModelViewSet):
    queryset = Recipe.objects.prefetch_related('recipeingredient_set__product')
    list_serializer_class = RecipeListSerializer
    detail_serializer_class = RecipeDetailSerializer


class DietPlanViewSet(MixedSerializerMixin, viewsets.ModelViewSet):
    queryset = DietPlan.objects.prefetch_related('daily_menus__meals__recipe')
    list_serializer_class = DietPlanListSerializer
    detail_serializer_class = DietPlanDetailSerializer


class DailyMenuViewSet(MixedSerializerMixin, viewsets.ModelViewSet):
    queryset = DailyMenu.objects.prefetch_related('meals__recipe')
    list_serializer_class = DailyMenuListSerializer
    detail_serializer_class = DailyMenuDetailSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['diet_plan']


class ScheduledMealViewSet(viewsets.ModelViewSet):
    queryset = ScheduledMeal.objects.select_related('recipe', 'daily_menu')
    serializer_class = ScheduledMealSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['daily_menu']