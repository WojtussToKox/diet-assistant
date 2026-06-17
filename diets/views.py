from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .permissions import CanManageDietPlan
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


class MixedSerializerMixin():
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
    permission_classes = [IsAuthenticated, CanManageDietPlan]


class DietPlanViewSet(MixedSerializerMixin, viewsets.ModelViewSet):
    list_serializer_class = DietPlanListSerializer
    detail_serializer_class = DietPlanDetailSerializer
    permission_classes = [IsAuthenticated, CanManageDietPlan]

    def get_queryset(self):
        user = self.request.user
        base_qs = DietPlan.objects.prefetch_related('daily_menus__meals__recipe')

        if user.role == 'DIETITIAN':
            return base_qs.filter(dietitian=user)
        elif user.role in ['PATIENT', 'STANDARD']:
            return base_qs.filter(patient=user)
        return base_qs.none()


class DailyMenuViewSet(MixedSerializerMixin, viewsets.ModelViewSet):
    list_serializer_class = DailyMenuListSerializer
    detail_serializer_class = DailyMenuDetailSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['diet_plan']

    permission_classes = [IsAuthenticated, CanManageDietPlan]

    def get_queryset(self):
        user = self.request.user
        base_qs = DailyMenu.objects.prefetch_related('meals__recipe')
        
        if user.role == 'DIETITIAN':
            return base_qs.filter(diet_plan__dietitian=user)
        elif user.role in ['PATIENT', 'STANDARD']:
            return base_qs.filter(diet_plan__patient=user)
        return base_qs.none()


class ScheduledMealViewSet(viewsets.ModelViewSet):
    serializer_class = ScheduledMealSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['daily_menu']

    permission_classes = [IsAuthenticated, CanManageDietPlan]

    def get_queryset(self):
        user = self.request.user
        base_qs = ScheduledMeal.objects.select_related('recipe', 'daily_menu')
        
        if user.role == 'DIETITIAN':
            return base_qs.filter(daily_menu__diet_plan__dietitian=user)
        elif user.role in ['PATIENT', 'STANDARD']:
            return base_qs.filter(daily_menu__diet_plan__patient=user)
        return base_qs.none()