from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .permissions import CanManageDietPlan, CanManageRecipe
from django_filters.rest_framework import DjangoFilterBackend
from .models import Recipe, DietPlan, DailyMenu, ScheduledMeal, MealLog
from django.http import HttpResponse
import csv
from rest_framework.decorators import action
from diets.services import DietPlanExportService, DietAnalyticsService
from .serializers import (
    RecipeListSerializer,
    RecipeDetailSerializer,
    DietPlanListSerializer,
    DietPlanDetailSerializer,
    DailyMenuListSerializer,
    DailyMenuDetailSerializer,
    ScheduledMealSerializer,
    MealLogSerializer
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
    permission_classes = [IsAuthenticated, CanManageRecipe]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

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

    @action(detail=True, methods=['get'], url_path='analytics')
    def analytics(self, request, pk=None):
        plan = self.get_object()
        try:
            analytics_service = DietAnalyticsService(plan)
            return Response({
                "averages": analytics_service.get_daily_averages(),
                "deviations": analytics_service.detect_calories_deviations()
            })
        except ValueError as e:
            return Response({
                "averages": None,
                "deviations": [],
                "message": str(e)
            })
        except Exception as e:
            return Response({"detail": f"Analytics error: {str(e)}"}, status=400)

    @action(detail=True, methods=['post'])
    def assign_to_patient(self, request, pk=None):
        original_plan = self.get_object()
        patient_id = request.data.get('patient')

        if not patient_id:
            return Response({'detail': 'Patient ID is required.'}, status=400)

        DietPlan.objects.filter(patient_id=patient_id, dietitian=request.user).delete()

        new_plan = DietPlan.objects.create(
            name=f"{original_plan.name}",
            patient_id=patient_id,
            dietitian=request.user,
            daily_calories_goal=original_plan.daily_calories_goal
        )

        for menu in original_plan.daily_menus.all():
            new_menu = DailyMenu.objects.create(
                diet_plan=new_plan,
                day_of_week=menu.day_of_week
            )
            for meal in menu.meals.all():
                ScheduledMeal.objects.create(
                    daily_menu=new_menu,
                    meal_type=meal.meal_type,
                    recipe=meal.recipe,
                    product=meal.product,
                    weight_in_grams=meal.weight_in_grams
                )

        return Response({'detail': 'Plan assigned successfully!', 'new_plan_id': new_plan.id})

class DietPlanExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, plan_id):
        plan = DietPlan.objects.filter(id=plan_id).first()
        if not plan:
            return Response({"detail": "Plan not found."}, status=404)

        if request.user.role == 'PATIENT' and plan.patient != request.user:
            return Response({"detail": "You cannot export someone else's plan."}, status=403)

        try:
            export_service = DietPlanExportService(plan)
            shopping_list_data = export_service._aggregate_shopping_list()

            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="shopping_list_plan_{plan.id}.csv"'

            writer = csv.writer(response)
            writer.writerow(['Product Name', 'Total Grams', 'Total Calories'])

            for item in shopping_list_data:
                writer.writerow([
                    item.get('product_name', ''),
                    item.get('total_grams', 0),
                    item.get('total_calories', 0)
                ])

            return response

        except Exception as e:
            return Response({"detail": f"Export error: {str(e)}"}, status=400)

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

class DietPlanBuilderView(APIView):
    """Common logic for creating and editing a diet plan template (drag&drop builder)."""
    permission_classes = [IsAuthenticated]

    def _validate_payload(self, data):
        """Checks basic fields and returns (name, daily_calories_goal) or throws ValueError."""
        name = data.get('name')
        daily_calories_goal = data.get('daily_calories_goal')

        if not name:
            raise ValueError("Field 'name' is required.")
        if not daily_calories_goal:
            raise ValueError("Field 'daily_calories_goal' is required.")

        return name, daily_calories_goal

    def _save_days(self, plan, days_data):
        """Creates a DailyMenu + ScheduledMeal for the given schedule. Assumes that old days have already been deleted (when editing)."""
        for day_data in days_data:
            day_of_week = day_data.get('day_of_week')
            if day_of_week is None:
                raise ValueError("Each day requires 'day_of_week'.")

            menu = DailyMenu.objects.create(
                diet_plan=plan,
                day_of_week=day_of_week
            )

            for meal_data in day_data.get('meals', []):
                recipe_id = meal_data.get('recipe')
                product_id = meal_data.get('product')

                if not recipe_id and not product_id:
                    raise ValueError(
                        f"Meal '{meal_data.get('meal_type')}' needs a recipe or a product."
                    )

                ScheduledMeal.objects.create(
                    daily_menu=menu,
                    meal_type=meal_data.get('meal_type'),
                    recipe_id=recipe_id,
                    product_id=product_id,
                    weight_in_grams=meal_data.get('weight_in_grams')
                )

    def post(self, request):
        """Creating a new diet plan template."""
        data = request.data
        user = request.user

        if user.role != 'DIETITIAN':
            return Response(
                {"detail": "Only dietitians can create diet plan templates."},
                status=403
            )

        try:
            name, daily_calories_goal = self._validate_payload(data)

            with transaction.atomic():
                plan = DietPlan.objects.create(
                    name=name,
                    daily_calories_goal=daily_calories_goal,
                    dietitian=user
                )
                self._save_days(plan, data.get('days', []))

            return Response({"detail": "The plan has been saved!", "plan_id": plan.id}, status=201)

        except ValueError as e:
            return Response({"detail": str(e)}, status=400)
        except Exception as e:
            import logging
            logging.exception("Error in creating a diet plan")
            return Response({"detail": f"Internal error: {str(e)}"}, status=500)

    def put(self, request, plan_id=None):
        """Editing an existing diet plan template."""
        data = request.data
        user = request.user

        plan = DietPlan.objects.filter(id=plan_id).first()
        if not plan:
            return Response({"detail": "Plan not found."}, status=404)

        if plan.dietitian != user:
            return Response({"detail": "You can only edit your own plans."}, status=403)

        try:
            name, daily_calories_goal = self._validate_payload(data)

            with transaction.atomic():
                plan.name = name
                plan.daily_calories_goal = daily_calories_goal
                plan.save()

                plan.daily_menus.all().delete()  # usuń stare dni, zbuduj od nowa
                self._save_days(plan, data.get('days', []))

            return Response({"detail": "Plan updated!", "plan_id": plan.id}, status=200)

        except ValueError as e:
            return Response({"detail": str(e)}, status=400)
        except Exception as e:
            import logging
            logging.exception("Error while editing diet plan")
            return Response({"detail": f"Internal error: {str(e)}"}, status=500)
        
class MealLogViewSet(viewsets.ModelViewSet):
    serializer_class = MealLogSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['date']
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MealLog.objects.filter(user=self.request.user)